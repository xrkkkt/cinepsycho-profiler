// --- START OF FILE services/geminiService.ts (实际上是 DeepSeek 实现) ---

import { ReviewItem, FullProfile } from "../types";
import { SYSTEM_INSTRUCTION, ROAST_mode_INSTRUCTION } from "../constants"; // 导入新定义的常量


// 如果你的环境变量叫 VITE_DEEPSEEK_API_KEY，请在这里修改；
// 或者你依然沿用 API_KEY 这个变量名，但在 .env 里填入 DeepSeek 的 key
const API_KEY = process.env.API_KEY 
// DeepSeek API 配置
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// --- 数据清洗与统计 (沿用之前的优化逻辑) ---
const calculateStats = (reviews: ReviewItem[]) => {
  const tagCounts: Record<string, number> = {};
  reviews.forEach(r => {
    r.tags?.forEach(t => {
      if(t && t.length < 10) tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([tag, count]) => `${tag}`)
    .join(", ");
};

const compressReviewsToText = (reviews: ReviewItem[]): string => {
  return reviews.map(r => {
    const year = r.date ? r.date.substring(0, 4) : "";
    const catIcon = r.category === 'movie' ? '🎬' : r.category === 'book' ? '📖' : '🎵';
    // DeepSeek 上下文很长，这里可以适当放宽字数限制，保留更多细节
    const commentShort = r.comment ? `"${r.comment}"` : ""; 
    return `${year} ${catIcon} 《${r.title}》 ${r.rating}★ ${commentShort}`;
  }).join("\n");
};

// DeepSeek 能够处理长文本，这里我们稍微放宽数量限制到 100 条
const smartSelection = (reviews: ReviewItem[]): ReviewItem[] => {
  const MAX_ITEMS = 100; 
  if (reviews.length <= MAX_ITEMS) return reviews;

  // 优先保留有评论的
  const withComments = reviews.filter(r => r.comment && r.comment.length > 2);
  if (withComments.length >= MAX_ITEMS) {
      return withComments.slice(0, MAX_ITEMS);
  }
  return reviews.slice(0, MAX_ITEMS);
};

// --- JSON 提取工具 (防止模型返回 markdown 格式) ---
const cleanJson = (text: string): string => {
    let clean = text.trim();
    // 如果模型包了 ```json ... ```，去掉它
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json/, '').replace(/```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```/, '').replace(/```$/, '');
    }
    return clean;
};

// --- 主函数 ---
export const analyzeProfile = async (
  rawReviews: ReviewItem[],
  enableImageGen: boolean = false,
  mode: 'normal' | 'roast' = 'normal' // 新增参数，默认为 normal
): Promise<FullProfile> => {
  
  if (!API_KEY) throw new Error("Missing API Key");

  // 1. 数据准备
  const selectedReviews = smartSelection(rawReviews);
  const topTags = calculateStats(rawReviews);
  const compressedText = compressReviewsToText(selectedReviews);

  // 2. 动态构建 System Prompt
  // 如果是锐评模式，把原来的指令 和 锐评指令 拼起来，或者覆盖它
  let currentSystemInstruction = SYSTEM_INSTRUCTION;
  if (mode === 'roast') {
      currentSystemInstruction += `\n\n${ROAST_mode_INSTRUCTION}`;
  }

  // 3. 构建用户 Prompt
  const userPrompt = `
  [Data Statistics]
  Total Records: ${rawReviews.length}
  Top Preferences: ${topTags}
  
  [Review Logs (${selectedReviews.length} items)]
  ${compressedText}
  
  Please analyze the user based on the logs and stats above.
  ${mode === 'roast' ? 'REMEMBER: BE SARCASTIC AND FUNNY. DO NOT BE NICE.' : ''}
  `;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: currentSystemInstruction },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }, 
            // 锐评模式稍微调高一点 creativity
            temperature: mode === 'roast' ? 1.3 : 1.0, 
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("DeepSeek API Error:", errText);
        throw new Error(`DeepSeek 请求失败: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (!content) throw new Error("DeepSeek 返回内容为空");

    // 解析 JSON
    const profile = JSON.parse(cleanJson(content)) as FullProfile;

    // --- 关于图片生成的处理 ---
    // DeepSeek 无法生图。如果开启了开关，我们在 console 提示用户，或者你可以接入第三方生图 API。
    // 这里为了不报错，我们将 avatarBase64 设为 null，前端会显示 emoji 或默认图。
    profile.avatarBase64 = undefined; 
    
    if (enableImageGen && profile.avatarPrompt) {
        console.log("DeepSeek 已生成头像 Prompt (但 DeepSeek 无法渲染图片):", profile.avatarPrompt);
        // 如果你以后想接 Stable Diffusion / Midjourney，就在这里接
    }

    return profile;

  } catch (error: any) {
    console.error("DeepSeek Analysis Failed:", error);
    // 处理特定的 DeepSeek 余额不足错误
    if (error.message?.includes('Balance insufficient')) {
        throw new Error("DeepSeek 余额不足 (尽管它很便宜，但还是需要充值的)。");
    }
    throw error;
  }
};