# GPT Image Quality MCP

一个面向 OpenAI-compatible API gateway 的图像生成 MCP server。它把技术方案里的 AI Director 思路落成了可调用工具：

- prompt intent parsing
- prompt rewrite / expansion
- aesthetic prior injection
- scene enhancement
- image multi-sampling
- optional vision rerank
- optional automatic refinement
- optional local image saving
- automatic image director routing
- domain-specific prompt packs and rerank rubrics

默认网关是 OpenAI API，也可以接任意兼容 `/v1/chat/completions` 与 `/v1/images/generations` 的代理、聚合网关或本地服务。

## Quick Start

```bash
npm install
npm run build
```

配置环境变量：

```bash
cp .env.example .env
export OPENAI_API_KEY="<YOUR_API_KEY>"
export OPENAI_BASE_URL="<OPENAI_COMPATIBLE_BASE_URL>"
```

Codex / Claude Desktop / 其他 MCP client 的 stdio 配置示例：

```json
{
  "mcpServers": {
    "gpt-img-gen": {
      "command": "node",
      "args": ["/absolute/path/to/gpt-image-2/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "<YOUR_API_KEY>",
        "OPENAI_BASE_URL": "<OPENAI_COMPATIBLE_BASE_URL>",
        "IMAGE_MODEL": "<IMAGE_MODEL_ID>",
        "TEXT_MODEL": "<TEXT_MODEL_ID>",
        "VISION_MODEL": "<VISION_MODEL_ID>"
      }
    }
  }
}
```

## MCP Tools

### `generate_image`

完整生成流水线。常用参数：

```json
{
  "prompt": "东京雨夜赛博朋克",
  "style": "cinematic",
  "aspect_ratio": "1:1",
  "size": "1536x1536",
  "sample_count": 4,
  "quality": "high",
  "output_format": "png",
  "rerank": true,
  "director_mode": "auto",
  "quality_mode": "official_like",
  "refine": false,
  "save_images": true,
  "output_dir": "outputs"
}
```

返回内容包含：

- `best_image`
- `all_images`
- `scores`
- `expanded_prompt`
- `final_prompt`
- `prompt_pipeline`
- `prompt_pipeline.director`
- `refinement_prompt`
- `gateway`

如果设置 `return_image_data: true`，工具还会把最佳图像作为 MCP image content 返回。默认关闭，避免大体积 base64 输出。

### `rewrite_image_prompt`

只运行 prompt pipeline，不生成图片。适合预览最终 prompt：

```json
{
  "prompt": "东京雨夜赛博朋克",
  "style": "cinematic",
  "rewrite_mode": "template"
}
```

`rewrite_mode` 可选：

- `auto`: 有网关和 key 时用 LLM，否则模板增强
- `llm`: 强制 LLM 扩写
- `template`: 纯本地模板扩写
- `off`: 不扩写，只注入审美和场景规则

### `list_image_styles`

列出内置风格：

- `cinematic`
- `anime`
- `luxury`
- `product`
- `portrait`
- `architecture`
- `landscape`
- `food`
- `scifi`
- `realistic`

也可以传任意自定义 `style` 文本。

### `list_director_modes`

列出内置图像导演模式。`generate_image` 和 `rewrite_image_prompt` 默认使用 `director_mode: "auto"` 自动路由，也可以手动指定：

- `general`
- `poster_editorial`
- `product_ad`
- `portrait`
- `character_design`
- `architecture_interior`
- `landscape_travel`
- `food_editorial`
- `infographic`
- `social_media_card`
- `logo_brand_mark`

每个 director mode 都有自己的：

- hard constraints
- quality targets
- failure risks
- negative prompt
- vision rerank rubric

例如海报会按版式、文字层级、信息密度、主视觉、纸张材质和一致性评分；产品图会按产品轮廓、材质、商业光、反射控制和背景纪律评分。

### `analyze_image_gap`

对比参考图和候选图，输出面向下一轮生成的结构化差距分析。适合用官方参考图或客户给定参考图来迭代候选结果。

```json
{
  "reference_image_path": "/path/to/reference.png",
  "candidate_image_path": "/path/to/candidate.png",
  "original_prompt": "生成一张高级城市文旅海报，主题为北京冬季城市图鉴",
  "director_mode": "auto"
}
```

也可以使用 URL：

```json
{
  "reference_image_url": "https://example.com/reference.png",
  "candidate_image_url": "https://example.com/candidate.png",
  "director_mode": "poster_editorial"
}
```

返回内容包含：

- `referenceStrengths`
- `candidateStrengths`
- `candidateWeaknesses`
- `missingElements`
- `dimensionScores`
- `overallSimilarity`
- `overallGap`
- `promptDeltas`
- `negativePromptAdditions`
- `nextPrompt`
- `rerankRubricAdjustments`

### `generate_image_with_reference`

先生成候选图，再自动调用 `analyze_image_gap` 和参考图做差距分析。默认只分析，不自动二次生成；如果设置 `retry: true`，并且 `overallGap >= retry_min_gap`，会把 `promptDeltas`、`nextPrompt` 和 `negativePromptAdditions` 合入一次额外生成。

```json
{
  "prompt": "生成一张高级城市文旅海报，主题为北京冬季城市图鉴",
  "reference_image_path": "/path/to/reference.png",
  "director_mode": "poster_editorial",
  "quality_mode": "official_like",
  "rewrite_mode": "off",
  "retry": true,
  "retry_min_gap": 25,
  "save_images": true
}
```

返回内容包含：

- `first_result`
- `gap_analysis`
- `retry_result`
- `final_result`

## OpenAI-Compatible Gateway

网关默认读取：

```bash
OPENAI_API_KEY=...
OPENAI_BASE_URL=<OPENAI_COMPATIBLE_BASE_URL>
```

每次工具调用也可以覆盖：

```json
{
  "prompt": "a luxury perfume bottle",
  "api_key": "<YOUR_API_KEY>",
  "base_url": "<OPENAI_COMPATIBLE_BASE_URL>",
  "image_model": "<IMAGE_MODEL_ID>",
  "text_model": "<TEXT_MODEL_ID>",
  "vision_model": "<VISION_MODEL_ID>"
}
```

兼容网关至少需要支持：

- `POST /v1/images/generations`
- 可选：`POST /v1/chat/completions`，用于 LLM prompt rewrite 和 vision rerank

如果 `chat/completions` 或视觉评分不可用，可以这样降级：

```json
{
  "prompt": "东京雨夜赛博朋克",
  "rewrite_mode": "template",
  "rerank": false
}
```

## Cost Control

普通生成：

```json
{
  "sample_count": 1,
  "rerank": false,
  "refine": false
}
```

高质量生成：

```json
{
  "sample_count": 4,
  "request_mode": "parallel",
  "director_mode": "auto",
  "quality_mode": "official_like",
  "rerank": true,
  "refine": true
}
```

对标官方体验时建议：

```json
{
  "director_mode": "auto",
  "quality_mode": "official_like",
  "sample_count": 4,
  "request_mode": "parallel",
  "rerank": true,
  "refine": true,
  "rewrite_mode": "off"
}
```

如果你已经写了非常明确的最终 prompt，使用 `rewrite_mode: "off"` 能减少二次改写导致的版式漂移；如果输入很短，则使用 `rewrite_mode: "llm"` 或 `auto`。

## Local Verification

```bash
npm test
```

测试不会调用真实 OpenAI API，只检查 prompt pipeline 和 OpenAI-compatible image response 解析。
