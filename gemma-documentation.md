# Gemma 4 model card

![Gemma 4 Banner](https://ai.google.dev/static/gemma/images/gemma4_banner.png)


[Hugging Face](https://huggingface.co/collections/google/gemma-4) \|
[GitHub](https://github.com/google-gemma) \|
[Launch Blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/) \|
[Documentation](https://ai.google.dev/gemma/docs/core)


**License** : [Apache 2.0](https://ai.google.dev/gemma/docs/gemma_4_license) \| **Authors** : [Google DeepMind](https://deepmind.google/models/gemma/)

Gemma is a family of open models built by Google DeepMind. Gemma 4 models are
multimodal, handling text and image input (with audio supported on small models)
and generating text output. This release includes open-weights models in both
pre-trained and instruction-tuned variants. Gemma 4 features a context window of
up to 256K tokens and maintains multilingual support in over 140 languages.

Featuring both Dense and Mixture-of-Experts (MoE) architectures, Gemma 4 is
well-suited for tasks like text generation, coding, and reasoning. The models
are available in four distinct sizes: **E2B** , **E4B** , **26B A4B** , and
**31B**. Their diverse sizes make them deployable in environments ranging from
high-end phones to laptops and servers, democratizing access to state-of-the-art
AI.

Gemma 4 introduces key **capability and architectural advancements**:

- **Reasoning** -- All models in the family are designed as highly capable
  reasoners, with configurable thinking modes.

- **Extended Multimodalities** -- Processes Text, Image with variable aspect
  ratio and resolution support (all models), Video, and Audio (featured
  natively on the E2B and E4B models).

- **Diverse \& Efficient Architectures** -- Offers Dense and Mixture-of-Experts
  (MoE) variants of different sizes for scalable deployment.

- **Optimized for On-Device** -- Smaller models are specifically designed for
  efficient local execution on laptops and mobile devices.

- **Increased Context Window** -- The small models feature a 128K context
  window, while the medium models support 256K.

- **Enhanced Coding \& Agentic Capabilities** -- Achieves notable improvements
  in coding benchmarks alongside native function-calling support, powering
  highly capable autonomous agents.

- **Native System Prompt Support** -- Gemma 4 introduces native support for the
  `system` role, enabling more structured and controllable conversations.

## **Models Overview**

Gemma 4 models are designed to deliver frontier-level performance at each size,
targeting deployment scenarios from mobile and edge devices (E2B, E4B) to
consumer GPUs and workstations (26B A4B, 31B). They are well-suited for
reasoning, agentic workflows, coding, and multimodal understanding.

The models employ a hybrid attention mechanism that interleaves local sliding
window attention with full global attention, ensuring the final layer is always
global. This hybrid design delivers the processing speed and low memory
footprint of a lightweight model without sacrificing the deep awareness required
for complex, long-context tasks. To optimize memory for long contexts, global
layers feature unified Keys and Values, and apply Proportional RoPE (p-RoPE).

### Dense Models

| Property | E2B | E4B | 31B Dense |
|---|---|---|---|
| **Total Parameters** | 2.3B effective (5.1B with embeddings) | 4.5B effective (8B with embeddings) | 30.7B |
| **Layers** | 35 | 42 | 60 |
| **Sliding Window** | 512 tokens | 512 tokens | 1024 tokens |
| **Context Length** | 128K tokens | 128K tokens | 256K tokens |
| **Vocabulary Size** | 262K | 262K | 262K |
| **Supported Modalities** | Text, Image, Audio | Text, Image, Audio | Text, Image |
| **Vision Encoder Parameters** | *\~150M* | *\~150M* | *\~550M* |
| **Audio Encoder Parameters** | *\~300M* | *\~300M* | No Audio |

The "E" in E2B and E4B stands for "effective" parameters. The smaller models
incorporate Per-Layer Embeddings (PLE) to maximize parameter efficiency in
on-device deployments. Rather than adding more layers or parameters to the
model, PLE gives each decoder layer its own small embedding for every token.
These embedding tables are large but are only used for quick lookups, which is
why the effective parameter count is much smaller than the total.

### Mixture-of-Experts (MoE) Model

| Property | 26B A4B MoE |
|---|---|
| **Total Parameters** | 25.2B |
| **Active Parameters** | 3.8B |
| **Layers** | 30 |
| **Sliding Window** | 1024 tokens |
| **Context Length** | 256K tokens |
| **Vocabulary Size** | 262K |
| **Expert Count** | 8 active / 128 total and 1 shared |
| **Supported Modalities** | Text, Image |
| **Vision Encoder Parameters** | *\~550M* |

The "A" in 26B A4B stands for "active parameters" in contrast to the total
number of parameters the model contains. By only activating a 4B subset of
parameters during inference, the Mixture-of-Experts model runs much faster than
its 26B total might suggest. This makes it an excellent choice for fast
inference compared to the dense 31B model since it runs almost as fast as a
4B-parameter model.

## **Benchmark Results**

These models were evaluated against a large collection of different datasets and
metrics to cover different aspects of text generation. Evaluation results marked
in the table are for instruction-tuned models.

|   | Gemma 4 31B | Gemma 4 26B A4B | Gemma 4 E4B | Gemma 4 E2B | Gemma 3 27B (no think) |
|---|---|---|---|---|---|
| MMLU Pro | 85.2% | 82.6% | 69.4% | 60.0% | 67.6% |
| AIME 2026 no tools | 89.2% | 88.3% | 42.5% | 37.5% | 20.8% |
| LiveCodeBench v6 | 80.0% | 77.1% | 52.0% | 44.0% | 29.1% |
| Codeforces ELO | 2150 | 1718 | 940 | 633 | 110 |
| GPQA Diamond | 84.3% | 82.3% | 58.6% | 43.4% | 42.4% |
| Tau2 (average over 3) | 76.9% | 68.2% | 42.2% | 24.5% | 16.2% |
| HLE no tools | 19.5% | 8.7% | - | - | - |
| HLE with search | 26.5% | 17.2% | - | - | - |
| BigBench Extra Hard | 74.4% | 64.8% | 33.1% | 21.9% | 19.3% |
| MMMLU | 88.4% | 86.3% | 76.6% | 67.4% | 70.7% |
| **Vision** |   |   |   |   |   |
| MMMU Pro | 76.9% | 73.8% | 52.6% | 44.2% | 49.7% |
| OmniDocBench 1.5 (average edit distance, lower is better) | 0.131 | 0.149 | 0.181 | 0.290 | 0.365 |
| MATH-Vision | 85.6% | 82.4% | 59.5% | 52.4% | 46.0% |
| MedXPertQA MM | 61.3% | 58.1% | 28.7% | 23.5% | - |
| **Audio** |   |   |   |   |   |
| CoVoST | - | - | 35.54 | 33.47 | - |
| FLEURS (lower is better) | - | - | 0.08 | 0.09 | - |
| **Long Context** |   |   |   |   |   |
| MRCR v2 8 needle 128k (average) | 66.4% | 44.1% | 25.4% | 19.1% | 13.5% |

## **Core Capabilities**

Gemma 4 models handle a broad range of tasks across text, vision, and audio. Key
capabilities include:

- **Thinking** -- Built-in reasoning mode that lets the model think step-by-step before answering.
- **Long Context** -- Context windows of up to 128K tokens (E2B/E4B) and 256K tokens (26B A4B/31B).
- **Image Understanding** -- Object detection, Document/PDF parsing, screen and UI understanding, chart comprehension, OCR (including multilingual), handwriting recognition, and pointing. Images can be processed at variable aspect ratios and resolutions.
- **Video Understanding** -- Analyze video by processing sequences of frames.
- **Interleaved Multimodal Input** -- Freely mix text and images in any order within a single prompt.
- **Function Calling** -- Native support for structured tool use, enabling agentic workflows.
- **Coding** -- Code generation, completion, and correction.
- **Multilingual** -- Out-of-the-box support for 35+ languages, pre-trained on 140+ languages.
- **Audio** (E2B and E4B only) -- Automatic speech recognition (ASR) and speech-to-translated-text translation across multiple languages.

## Getting Started

You can use all Gemma 4 models with the latest version of Transformers. To get
started, install the necessary dependencies in your environment:

`pip install -U transformers torch accelerate`

Once you have everything installed, you can proceed to load the model with the
code below:

    import torch
    from transformers import AutoProcessor, AutoModelForCausalLM

    MODEL_ID = "google/gemma-4-E2B-it"

    # Load model
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        dtype=torch.bfloat16,
        device_map="auto"
    )

Once the model is loaded, you can start generating output:

    # Prompt
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Write a short joke about saving RAM."},
    ]

    # Process input
    text = processor.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=False
    )
    inputs = processor(text=text, return_tensors="pt").to(model.device)
    input_len = inputs["input_ids"].shape[-1]

    # Generate output
    outputs = model.generate(**inputs, max_new_tokens=1024)
    response = processor.decode(outputs[0][input_len:], skip_special_tokens=False)

    # Parse thinking
    processor.parse_response(response)

To enable reasoning, set `enable_thinking=True` and the `parse_response`
function will take care of parsing the thinking output.

## **Best Practices**

For the best performance, use these configurations and best practices:

### 1. Sampling Parameters

Use the following standardized sampling configuration across all use cases:

- `temperature=1.0`
- `top_p=0.95`
- `top_k=64`

### 2. Thinking Mode Configuration

Compared to Gemma 3, the models use standard `system`, `assistant`, and `user`
roles. To properly manage the thinking process, use the following control
tokens:

- **Trigger Thinking:** Thinking is enabled by including the `<|think|>` token at the start of the system prompt. To disable thinking, remove the token.
- **Standard Generation:** When thinking is enabled, the model will output its internal reasoning followed by the final answer using this structure: `<|channel>thought\n`**\[Internal reasoning\]** `<channel|>`
- **Disabled Thinking Behavior:** For all models except for the E2B and E4B variants, if thinking is disabled, the model will still generate the tags but with an empty thought block: `<|channel>thought\n<channel|>`**\[Final
  answer\]**

> Note that many libraries like Transformers and llama.cpp handle the
> complexities of the chat template for you.

### 3. Multi-Turn Conversations

- **No Thinking Content in History** : In multi-turn conversations, the historical model output should only include the final response. Thoughts from previous model turns must *not be added* before the next user turn begins.

### 4. Modality order

- For optimal performance with multimodal inputs, place image and/or audio content **before** the text in your prompt.

### 5. Variable Image Resolution

Aside from variable aspect ratios, Gemma 4 supports variable image resolution
through a configurable visual token budget, which controls how many tokens are
used to represent an image. A higher token budget preserves more visual detail
at the cost of additional compute, while a lower budget enables faster inference
for tasks that don't require fine-grained understanding.

- The supported token budgets are: **70** , **140** , **280** , **560** , and **1120** .
  - Use *lower budgets* for classification, captioning, or video understanding, where faster inference and processing many frames outweigh fine-grained detail.
  - Use *higher budgets* for tasks like OCR, document parsing, or reading small text.

### 6. Audio

Use the following prompt structures for audio processing:

- **Audio Speech Recognition (ASR)**

    Transcribe the following speech segment in {LANGUAGE} into {LANGUAGE} text.

    Follow these specific instructions for formatting the answer:
    *   Only output the transcription, with no newlines.
    *   When transcribing numbers, write the digits, i.e. write 1.7 and not one point seven, and write 3 instead of three.

- **Automatic Speech Translation (AST)**

    Transcribe the following speech segment in {SOURCE_LANGUAGE}, then translate it into {TARGET_LANGUAGE}.
    When formatting the answer, first output the transcription in {SOURCE_LANGUAGE}, then one newline, then output the string '{TARGET_LANGUAGE}: ', then the translation in {TARGET_LANGUAGE}.

### 7. Audio and Video Length

All models support image inputs and can process videos as frames whereas the E2B
and E4B models also support audio inputs. Audio supports a maximum length of 30
seconds. Video supports a maximum of 60 seconds assuming the images are
processed at one frame per second.

## **Model Data**

Data used for model training and how the data was processed.

### **Training Dataset**

Our pre-training dataset is a large-scale, diverse collection of data
encompassing a wide range of domains and modalities, which includes web
documents, code, images, audio, with a cutoff date of January 2025. Here are the
key components:

- **Web Documents**: A diverse collection of web text ensures the model is exposed to a broad range of linguistic styles, topics, and vocabulary. The training dataset includes content in over 140 languages.
- **Code**: Exposing the model to code helps it to learn the syntax and patterns of programming languages, which improves its ability to generate code and understand code-related questions.
- **Mathematics**: Training on mathematical text helps the model learn logical reasoning, symbolic representation, and to address mathematical queries.
- **Images**: A wide range of images enables the model to perform image analysis and visual data extraction tasks.

The combination of these diverse data sources is crucial for training a powerful
multimodal model that can handle a wide variety of different tasks and data
formats.

### **Data Preprocessing**

Here are the key data cleaning and filtering methods applied to the training
data:

- **CSAM Filtering**: Rigorous CSAM (Child Sexual Abuse Material) filtering was applied at multiple stages in the data preparation process to ensure the exclusion of harmful and illegal content.
- **Sensitive Data Filtering**: As part of making Gemma pre-trained models safe and reliable, automated techniques were used to filter out certain personal information and other sensitive data from training sets.
- **Additional methods** : Filtering based on content quality and safety in line with [our
  policies](https://ai.google/static/documents/ai-responsibility-update-published-february-2025.pdf).

## **Ethics and Safety**

As open models become central to enterprise infrastructure, provenance and
security are paramount. Developed by Google DeepMind, Gemma 4 undergoes the same
rigorous safety evaluations as our proprietary Gemini models.

### **Evaluation Approach**

Gemma 4 models were developed in partnership with internal safety and
responsible AI teams. A range of automated as well as human evaluations were
conducted to help improve model safety. These evaluations align with [Google's
AI principles](https://ai.google/principles/), as well as safety policies, which
aim to prevent our generative AI models from generating harmful content,
including:

- Content related to child sexual abuse material and exploitation
- Dangerous content (e.g., promoting suicide, or instructing in activities that could cause real-world harm)
- Sexually explicit content
- Hate speech (e.g., dehumanizing members of protected groups)
- Harassment (e.g., encouraging violence against people)

### **Evaluation Results**

For all areas of safety testing, we saw major improvements in all categories of
content safety relative to previous Gemma models. Overall, Gemma 4 models
significantly outperform Gemma 3 and 3n models in improving safety, while
keeping unjustified refusals low. All testing was conducted without safety
filters to evaluate the model capabilities and behaviors. For both text-to-text
and image-to-text, and across all model sizes, the model produced minimal policy
violations, and showed significant improvements over previous Gemma models'
performance.

## **Usage and Limitations**

These models have certain limitations that users should be aware of.

### **Intended Usage**

Multimodal models (capable of processing vision, language, and/or audio) have a
wide range of applications across various industries and domains. The following
list of potential uses is not comprehensive. The purpose of this list is to
provide contextual information about the possible use-cases that the model
creators considered as part of model training and development.

- **Content Creation and Communication**
  - **Text Generation**: These models can be used to generate creative text formats such as poems, scripts, code, marketing copy, and email drafts.
  - **Chatbots and Conversational AI**: Power conversational interfaces for customer service, virtual assistants, or interactive applications.
  - **Text Summarization**: Generate concise summaries of a text corpus, research papers, or reports.
  - **Image Data Extraction**: These models can be used to extract, interpret, and summarize visual data for text communications.
  - **Audio Processing and Interaction**: The smaller models (E2B and E4B) can analyze and interpret audio inputs, enabling voice-driven interactions and transcriptions.
- **Research and Education**
  - **Natural Language Processing (NLP) and VLM Research**: These models can serve as a foundation for researchers to experiment with VLM and NLP techniques, develop algorithms, and contribute to the advancement of the field.
  - **Language Learning Tools** : Support interactive language learning experiences, aiding in grammar correction or providing writing practice.
    - **Knowledge Exploration**: Assist researchers in exploring large bodies of text by generating summaries or answering questions about specific topics.

### **Limitations**

- **Training Data**
  - The quality and diversity of the training data significantly influence the model's capabilities. Biases or gaps in the training data can lead to limitations in the model's responses.
  - The scope of the training dataset determines the subject areas the model can handle effectively.
- **Context and Task Complexity**
  - Models perform well on tasks that can be framed with clear prompts and instructions. Open-ended or highly complex tasks might be challenging.
  - A model's performance can be influenced by the amount of context provided (longer context generally leads to better outputs, up to a certain point).
- **Language Ambiguity and Nuance**
  - Natural language is inherently complex. Models might struggle to grasp subtle nuances, sarcasm, or figurative language.
- **Factual Accuracy**
  - Models generate responses based on information they learned from their training datasets, but they are not knowledge bases. They may generate incorrect or outdated factual statements.
- **Common Sense**
  - Models rely on statistical patterns in language. They might lack the ability to apply common sense reasoning in certain situations.

### **Ethical Considerations and Risks**

The development of vision-language models (VLMs) raises several ethical
concerns. In creating an open model, we have carefully considered the following:

- **Bias and Fairness**
  - VLMs trained on large-scale, real-world text and image data can reflect socio-cultural biases embedded in the training material. Gemma 4 models underwent careful scrutiny, input data pre-processing, and post-training evaluations as reported in this card to help mitigate the risk of these biases.
- **Misinformation and Misuse**
  - VLMs can be misused to generate text that is false, misleading, or harmful.
  - Guidelines are provided for responsible use with the model, see the [Responsible Generative AI Toolkit](https://ai.google.dev/responsible).
- **Transparency and Accountability**
  - This model card summarizes details on the models' architecture, capabilities, limitations, and evaluation processes.
  - A responsibly developed open model offers the opportunity to share innovation by making VLM technology accessible to developers and researchers across the AI ecosystem.

**Risks identified and mitigations**:

- **Generation of harmful content**: Mechanisms and guidelines for content safety are essential. Developers are encouraged to exercise caution and implement appropriate content safety safeguards based on their specific product policies and application use cases.
- **Misuse for malicious purposes**: Technical limitations and developer and end-user education can help mitigate against malicious applications of VLMs. Educational resources and reporting mechanisms for users to flag misuse are provided.
- **Privacy violations**: Models were trained on data filtered for removal of certain personal information and other sensitive data. Developers are encouraged to adhere to privacy regulations with privacy-preserving techniques.
- **Perpetuation of biases**: It's encouraged to perform continuous monitoring (using evaluation metrics, human review) and the exploration of de-biasing techniques during model training, fine-tuning, and other use cases.

### **Benefits**

At the time of release, this family of models provides high-performance open
vision-language model implementations designed from the ground up for
responsible AI development compared to similarly sized models.

# Run Gemma content generation and inferences

There are two key decisions to make when you want to run a Gemma model:
1) what Gemma variant you want to run, and 2) what AI execution framework you
are going to use to run it? A key issue in making both these decisions has to do
with what hardware you and your users have available to run the model.

This overview helps you navigate these decisions and start working with Gemma
models. The general steps for running a Gemma model are as follows:

- [Choose a framework for running](https://ai.google.dev/gemma/docs/run#choose-a-framework)
- [Select a Gemma variant](https://ai.google.dev/gemma/docs/run#select-a-variant)
- [Run generation and inference requests](https://ai.google.dev/gemma/docs/run#run-generation)

## Choose a framework

Gemma models are compatible with a wide variety of ecosystem tools. Choosing the
right one depends on your available hardware (Cloud GPUs versus Local Laptop)
and your interface preference (Python code versus Desktop Application).

Use the following table to quickly identify the best tool for your needs:

| If you want to... | Recommended Framework | Best For |
|---|---|---|
| **Run locally with a Chat UI** | - **[LM Studio](https://ai.google.dev/gemma/docs/integrations/lmstudio)** - **[Ollama](https://ai.google.dev/gemma/docs/integrations/ollama)** | Beginners, or users who want a "Gemini-like" experience on their laptop. |
| **Run efficiently on Edge** | - **[LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM)** - **[llama.cpp](https://github.com/ggml-org/llama.cpp)** - **[MediaPipe LLM Inference API](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference)** - **[MLX](https://github.com/ml-explore/mlx)** | High-performance local inference with minimal resources. |
| **Build/Train in Python** | - **[Gemma library for JAX](https://gemma-llm.readthedocs.io)** - **[Hugging Face Transformers](https://huggingface.co/docs/transformers/en/model_doc/gemma3)** - **[Keras](https://ai.google.dev/gemma/docs/core/keras_inference)** - **[PyTorch](https://ai.google.dev/gemma/docs/core/pytorch_gemma)** - **[Unsloth](https://unsloth.ai/blog/gemma3)** | Researchers and Developers building custom applications or fine-tuning models. |
| **Deploy to Production / Enterprise** | - **[Google Cloud Kubernetes Engine (GKE)](https://ai.google.dev/gemma/docs/core/gke)** - **[Google Cloud Run](https://ai.google.dev/gemma/docs/core/deploy_to_cloud_run_from_ai_studio)** - **[Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/open-models/use-gemma)** - **[vLLM](https://docs.cloud.google.com/kubernetes-engine/docs/tutorials/serve-gemma-gpu-vllm)** | Scalable, managed cloud deployment with enterprise security and MLOps support. |

### Framework Details

The following are guides for running Gemma models categorized by your deployment
environment.

#### 1. Desktop \& Local Inference (High Efficiency)

These tools allow you to run Gemma on consumer hardware (laptops, desktops) by
utilizing optimized formats (like GGUF) or specific hardware accelerators.

- **[LM Studio](https://ai.google.dev/gemma/docs/integrations/lmstudio)**: A desktop application that lets you download and chat with Gemma models in a user-friendly interface. No coding required.
- **[llama.cpp](https://github.com/ggml-org/llama.cpp)**: A popular open-source C++ port of Llama (and Gemma) that runs incredibly fast on CPUs and Apple Silicon.
- **[LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM)** : Offers a command-line interface ([CLI](https://github.com/google-ai-edge/LiteRT-LM?tab=readme-ov-file#desktop-cli-lit)) to run optimized `.litertlm` Gemma models on desktop (Windows, Linux, macOS), powered by LiteRT (formerly TFLite).
- **[MLX](https://github.com/ml-explore/mlx)**: A framework designed specifically for machine learning on
  Apple Silicon, perfect for Mac users who want built-in performance.

- **[Ollama](https://ai.google.dev/gemma/docs/integrations/ollama)**: A tool to run open LLMs locally, often used to power
  other applications.

#### 2. Python Development (Research \& Fine-tuning)

Standard frameworks for AI developers building applications, pipelines, or
training models.

- **[Hugging Face Transformers](https://huggingface.co/docs/transformers/en/model_doc/gemma3)**: The industry standard for quick access to models and pipelines.
- **[Unsloth](https://unsloth.ai/blog/gemma3)**: An optimized library for fine-tuning LLMs. It lets you train Gemma models 2-5x faster with significantly less memory, making it possible to fine-tune on consumer GPUs (e.g., free Google Colab tiers).
- **[Keras](https://ai.google.dev/gemma/docs/core/keras_inference)** / **[JAX](https://gemma-llm.readthedocs.io)** / **[PyTorch](https://ai.google.dev/gemma/docs/core/pytorch_gemma)**: Core libraries for deep learning research and custom architecture implementation.

#### 3. Mobile \& Edge Deployment (On-Device)

Frameworks designed to run LLMs directly on user devices (Android, iOS, Web)
without internet connectivity, often utilizing NPUs (Neural Processing Units).

- **[LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM)**: The fully open-source framework for on-device LLM development that offers maximum performance and fine-grained control, with direct support for CPU, GPU, and NPU acceleration on Android and iOS.
- **[MediaPipe LLM Inference API](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference)**: The easiest way to integrate Gemma into cross-platform apps. It offers a high-level API that works across Android, iOS, and Web.

#### 4. Cloud \& Production Deployment

Managed services for scaling your application to thousands of users or accessing
massive compute power.

- **[Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/open-models/use-gemma)**: Google Cloud's fully managed AI platform. Best for enterprise applications requiring SLAs and scaling.
- **[Google Cloud Kubernetes Engine (GKE)](https://ai.google.dev/gemma/docs/core/gke)**: For orchestrating your own serving clusters.
- **[vLLM](https://docs.cloud.google.com/kubernetes-engine/docs/tutorials/serve-gemma-gpu-vllm)**: A high-throughput and memory-efficient inference and serving engine, often used in cloud deployments.

Make sure your intended deployment Gemma model format, such as Keras built-in
format, Safetensors, or GGUF, is supported by your chosen framework.

## Select a Gemma variant

Gemma models are available in several variants and sizes, including the
foundation or [core](https://ai.google.dev/gemma/docs/core) Gemma models, and more
specialized model variants such as
[PaliGemma](https://ai.google.dev/gemma/docs/paligemma) and
[DataGemma](https://ai.google.dev/gemma/docs/datagemma), and many variants
created by the AI developer community on sites such as
[Kaggle](https://www.kaggle.com/models?query=gemma) and
[Hugging Face](https://huggingface.co/models?search=gemma). If you are unsure
about what variant you should start with, select the latest Gemma
[core](https://ai.google.dev/gemma/docs/core) instruction-tuned (IT) model with
the lowest number of parameters. This type of Gemma model has low compute
requirements and be able to respond to a wide variety of prompts without
requiring additional development.

Consider the following factors when choosing a Gemma variant:

- **Gemma core, and other variant families such as PaliGemma, CodeGemma** : *Recommend Gemma (core).* Gemma variants beyond the core version have the same architecture as the core model, and are trained to perform better at specific tasks. Unless your application or goals align with the specialization of a specific Gemma variant, it is best to start with a Gemma core, or base, model.
- **Instruction-tuned (IT), pre-trained (PT), fine-tuned (FT), mixed
  (mix)** : *Recommend IT.*
  - *Instruction-tuned* (IT) Gemma variants are models that have been trained to respond to a variety of instructions or requests in human language. These model variants are the best place to start because they can respond to prompts without further model training.
  - *Pre-trained* (PT) Gemma variants are models that have been trained to make inferences about language or other data, but have not been trained to follow human instructions. These models require additional training or tuning to be able to perform tasks effectively, and are meant for researchers or developers who want to study or develop the capabilities of the model and its architecture.
  - *Fine-tuned* (FT) Gemma variants can be considered IT variants, but are typically trained to perform a specific task, or perform well on a specific generative AI benchmark. The PaliGemma variant family includes a number of FT variants.
  - *Mixed* (mix) Gemma variants are versions of PaliGemma models that have been instruction tuned with a variety of instructions and are suitable for general use.
- **Parameters** : *Recommend smallest number available*. In general, the more parameters a model has, the more capable it is. However, running larger models requires larger and more complex compute resources, and generally slows down development of an AI application. Unless you have already determined that a smaller Gemma model cannot meet your needs, choose a one with a small number of parameters.
- **Quantization levels:** *Recommend half precision (16-bit), except for
  tuning*. Quantization is a complex topic that boils down to what size and precision of data, and consequently how much memory a generative AI model uses for calculations and generating responses. After a model is trained with high-precision data, which is typically 32-bit floating point data, models like Gemma can be modified to use lower precision data such as 16, 8 or 4-bit sizes. These quantized Gemma models can still perform well, depending on the complexity of the tasks, while using significantly less compute and memory resources. However, tools for tuning quantized models are limited and may not be available within your chosen AI development framework. Typically, you must fine-tune a model like Gemma at full precision, then quantize the resulting model.

For a list of key, Google-published Gemma models, see the
[Getting started with Gemma models](https://ai.google.dev/gemma/docs/get_started#models-list),
Gemma model list.

## Run generation and inference requests

After you have selected an AI execution framework and a Gemma variant, you can
start running the model, and prompting it to generate content or complete tasks.
For more information on how to run Gemma with a specific framework, see the
guides linked in the [Choose a framework](https://ai.google.dev/gemma/docs/run#choose-a-framework) section.

### Prompt formatting

All instruction-tuned Gemma variants have specific prompt formatting
requirements. Some of these formatting requirements are handled automatically by
the framework you use to run Gemma models, but when you are sending prompt data
directly to a tokenizer, you must add specific tags, and the tagging
requirements can change depending on the Gemma variant you are using. See the
following guides for information on Gemma variant prompt formatting and system
instructions:

- [Gemma prompt and system instructions](https://ai.google.dev/gemma/docs/core/prompt-formatting-gemma4)
- [PaliGemma prompt and system instructions](https://ai.google.dev/gemma/docs/paligemma/prompt-system-instructions)
- [CodeGemma prompt and system instructions](https://ai.google.dev/gemma/docs/codegemma/prompt-structure)
- [FunctionGemma formatting and best practices](https://ai.google.dev/gemma/docs/functiongemma/formatting-and-best-practices)

# Gemma 4 Prompt Formatting

Starting with Gemma 4, we introduce new control tokens. For Gemma 3 and lower,
see the [previous document](https://ai.google.dev/gemma/docs/core/prompt-structure).

The following sections specify the control tokens used by Gemma 4 and their use
cases. Note that the control tokens are reserved in and specific to our
tokenizer.

- Token to indicate a system instruction: `system`
- Token to indicate a user turn: `user`
- Token to indicate a model turn: `model`
- Token to indicate the beginning of a dialogue turn: `<|turn>`
- Token to indicate the end of a dialogue turn: `<turn|>`

Here's an example dialogue:

    <|turn>system
    You are a helpful assistant.<turn|>
    <|turn>user
    Hello.<turn|>

## Multi-modalities

| Multimodal Token | Purpose |
|---|---|
| `<|image>` `<image|>` | Indicate image embeddings |
| `<|audio>` `<audio|>` | Indicate audio embeddings |
| `<|image|>` `<|audio|>` | Special placeholder tokens |

We use two special placeholder tokens (`<|image|>` and `<|audio|>`) to specify
where image and audio tokens should be inserted. After tokenization, these
tokens are replaced by the actual soft embeddings inside the model.

Here is an example dialogue:

    prompt = """<|turn>user
    Describe this image: <|image|>

    And translate these audio:

    a. <|audio|>
    b. <|audio|><turn|>
    <|turn>model"""

## Agentic and Reasoning Control Tokens

To support agentic workflows, Gemma uses specialized control tokens that
delineate internal reasoning (thinking) from external actions (function
calling). These tokens allow the model to process complex logic before providing
a final response or interacting with outside tools.

### Function Calling

Gemma 4 is trained on six special tokens to manage the "tool use" lifecycle.

| Token Pair | Purpose |
|---|---|
| `<|tool>` `<tool|>` | Defines a tool |
| `<|tool_call>` `<tool_call|>` | Indicates a model's request to use a tool. |
| `<|tool_response>` `<tool_response|>` | Provides a tool's execution result back to the model. |

> [!NOTE]
> **Note:** `<|tool_response>` acts as an additional stop sequence for the inference engine.

**Delimiter for String Values: `<|"|>`**

A single token, `<|"|>`, is used as a delimiter for **all string values**
within the structured data blocks.

- **Purpose:** This token ensures that any special characters (such as `{`, `}`, `,`, or quotes) inside a string are treated as literal text and not as part of the data structure's underlying syntax.
- **Usage:** All string literals in your function declarations, calls, and responses must be enclosed using this token (e.g., `key:<|"|>string
  value<|"|>`).

### Thinking Mode

To activate thinking mode, include the `<|think|>` control token within the
system instruction.

| Control Token | Purpose |
|---|---|
| `<|think|>` | Activates thinking mode |
| `<|channel>` `<channel|>` | Indicates a model's internal process. |

> [!NOTE]
> **Note:** `<|channel>` is always followed by the word "thought" when thinking mode is active.

Here is an example dialogue:

    <|turn>system
    <|think|><turn|>
    <|turn>user
    What is the water formula?<turn|>
    <|turn>model
    <|channel>thought
    ...
    <channel|>The most common interpretation of "the water formula" refers...<turn|>

Thinking mode is designed to be enabled at the conversation level. This should
be consolidated into a single system turn alongside your other system
instructions, such as tool definitions.

### Reasoning and Function Calling Example

In an agentic turn, the model may "think" privately before deciding to call a
function. The lifecycle follows this sequence:

1. User Inquiry: The user asks a question.
2. Internal Reasoning: The model thinks privately in the thought channel.
3. Tool Request: The model halts generation to request a tool call.
4. Execution \& Injection: The application executes the tool and appends the response.
5. Final Response: The model reads the response and generates the final answer.

The following example demonstrates a model using a weather tool:

    <|turn>system
    <|think|>You are a helpful assistant.<|tool>declaration:get_current_temperature{...}<tool|><turn|>
    <|turn>user
    What's the temperature in London?<turn|>
    <|turn>model
    <|channel>thought
    ...
    <channel|><|tool_call>call:get_current_temperature{location:<|"|>London<|"|>}<tool_call|><|tool_response>

Your application should parse the model's response to extract the function name
and arguments, execute the function, and then append the `tool_calls` and
`tool_responses` to the chat history under the `assistant` role.

    <|turn>model
    <|tool_call>call:get_current_weather{location:<|"|>London<|"|>}<tool_call|><|tool_response>response:get_current_weather{temperature:15,weather:<|"|>sunny<|"|>}<tool_response|>

Finally, Gemma reads the tool response and replies to the user.

    The temperature in London is 15 degrees and it is sunny.<turn|>

Here is the complete JSON chat history for this example:

    [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "What's the temperature in London?"
      },
      {
        "role": "assistant",
        "tool_calls": [
          {
            "function": {
              "name": "get_current_weather",
              "arguments": {
                "location": "London"
              }
            }
          }
        ],
        "tool_responses": [
          {
            "name": "get_current_weather",
            "response": {
              "temperature": 15,
              "weather": "sunny"
            }
          }
        ],
        "content": "The temperature in London is 15 degrees and it is sunny."
      }
    ]

### Managing Thought Context Between Turns

Properly managing the model's generated thoughts is critical for maintaining
performance across multi-turn conversations.

- **Standard Multi-Turn Conversations:** You must remove (strip) the model's generated thoughts from the previous turn before passing the conversation history back to the model for the next turn. If you want to disable thinking mode mid-conversation, you can remove the `<|think|>` token when you strip the previous thoughts.
- **Function Calling (Exception):** If a single model turn involves function or tool calls, thoughts must **NOT** be removed between the function calls.

**Agentic Workflows and Long-Running Tasks**

Because raw thoughts are stripped between standard turns, developers building
long-running agents may want to retain reasoning context to prevent the model
from entering cyclical reasoning loops.

- **Summarizing Thoughts:** A highly recommended inference technique is to extract, summarize, and feed the model's previous thoughts back into the context window as standard text.
- **Formatting Constraints:** Because Gemma 4 was not explicitly trained with raw thoughts included in the prompt (outside of the specific tool-call scenario mentioned above), there is no strict or specific format expected by the model for these injected thoughts. You have the flexibility to format summarized reasoning in whatever way best suits your specific agentic architecture.

## Integration Notes

- **Internal State:** The `<|channel>` and `<channel|>` tokens are typically used for Chain-of-Thought (CoT) processing. In standard user-facing applications, this content is usually hidden from the end-user.
- **Tool Loop:** The `tool_call` and `tool_response` tokens facilitate a "handshake" between the model your application environment. The application intercepts the `tool_call`, executes the underlying code, and feeds the result back to the model within the `tool_response` tokens.
- **Model Behavior:** Larger models (e.g., gemma-4-26B-A4B-it, gemma-4-31B-it) may occasionally generate a thought channel even when thinking mode is explicitly turned off. To stabilize model behavior in these edge cases, consider adding an empty thinking token to the prompt.

## Tip: Fine-Tuning Big Models with No-Thinking Datasets

When fine-tuning larger Gemma models with a dataset that does not include
thinking, you can achieve better results by adding the empty channel to your
training prompts:

    <|turn>model
    <|channel>thought
    <channel|>

## Tip: Adaptive Thought Efficiency using System Instructions

While "thinking" in Gemma 4 is officially supported as an ON or OFF boolean
feature, the model has exceptionally strong instruction-following capabilities
that allow you to modulate its thinking behavior dynamically.

Rather than relying on a hardcoded framework parameter for "high" or "low"
thinking, you can use System Instructions (SI) to guide the model into a reduced
thinking mode. By explicitly instructing the model to think efficiently or at a
lower depth (a concept we refer to as a "LOW" thinking instruction), you can
achieve adaptive thought efficiency.

- **Reduced Cost:** Testing has shown that applying a "LOW" thinking System Instruction can reduce the number of thinking tokens generated by approximately 20%.
- **Proof of Concept:** Because this behavior is a byproduct of the model's instructability rather than a specifically trained, there is no single "perfect" prompt. The "LOW" instruction is a proof of concept.
- **Customization:** We highly encourage developers to play around with their own custom System Instructions. You can fine-tune the depth, length, and style of the model's thinking process to perfectly balance latency, cost, and output quality for your specific use cases.

# Gemma Basic Text Inference

|---|---|---|---|---|
| [![](https://ai.google.dev/static/site-assets/images/docs/notebook-site-button.png)View on ai.google.dev](https://ai.google.dev/gemma/docs/capabilities/text/basic) | [![](https://www.tensorflow.org/images/colab_logo_32px.png)Run in Google Colab](https://colab.research.google.com/github/google-gemma/cookbook/blob/main/docs/capabilities/text/basic.ipynb) | [![](https://www.kaggle.com/static/images/logos/kaggle-logo-transparent-300.png)Run in Kaggle](https://kaggle.com/kernels/welcome?src=https://github.com/google-gemma/cookbook/blob/main/docs/capabilities/text/basic.ipynb) | [![](https://ai.google.dev/images/cloud-icon.svg)Open in Vertex AI](https://console.cloud.google.com/vertex-ai/colab/import/https%3A%2F%2Fraw.githubusercontent.com%2Fgoogle-gemma%2Fcookbook%2Fmain%2Fdocs%2Fcapabilities%2Ftext%2Fbasic.ipynb) | [![](https://www.tensorflow.org/images/GitHub-Mark-32px.png)View source on GitHub](https://github.com/google-gemma/cookbook/blob/main/docs/capabilities/text/basic.ipynb) |

Gemma is a family of lightweight, state-of-the-art open models built from the same research and technology used to create the [Gemini](https://deepmind.google/technologies/gemini/#introduction) models. Gemma 4 is designed to be the world's most efficient open-weight model family.

This document provides a guide to performing basic text inference with Gemma 4 using the Hugging Face `transformers` library. It covers environment setup, model loading, and various text generation scenarios including single-turn prompts, structured multi-turn conversations, and applying system instructions.

This notebook will run on T4 GPU.

## Install Python packages

Install the Hugging Face libraries required for running the Gemma model and making requests.

    # Install PyTorch & other libraries
    pip install torch accelerate

    # Install the transformers library
    pip install transformers

[Dialog](https://github.com/google-deepmind/dialog) is a library to manipulate and display conversations.

    pip install dialog

```
Collecting dialog
  Downloading dialog-1.0.0-py3-none-any.whl.metadata (3.4 kB)
Requirement already satisfied: etils[enp,epath,epy] in /usr/local/lib/python3.12/dist-packages (from dialog) (1.14.0)
Requirement already satisfied: lark in /usr/local/lib/python3.12/dist-packages (from dialog) (1.3.1)
Requirement already satisfied: numpy in /usr/local/lib/python3.12/dist-packages (from dialog) (2.0.2)
Requirement already satisfied: pillow in /usr/local/lib/python3.12/dist-packages (from dialog) (11.3.0)
Requirement already satisfied: requests in /usr/local/lib/python3.12/dist-packages (from dialog) (2.32.4)
Requirement already satisfied: anywidget in /usr/local/lib/python3.12/dist-packages (from dialog) (0.9.21)
Requirement already satisfied: mcp in /usr/local/lib/python3.12/dist-packages (from dialog) (1.26.0)
Requirement already satisfied: pydub in /usr/local/lib/python3.12/dist-packages (from dialog) (0.25.1)
Requirement already satisfied: ipywidgets>=7.6.0 in /usr/local/lib/python3.12/dist-packages (from anywidget->dialog) (7.7.1)
Requirement already satisfied: psygnal>=0.8.1 in /usr/local/lib/python3.12/dist-packages (from anywidget->dialog) (0.15.1)
Requirement already satisfied: typing-extensions>=4.2.0 in /usr/local/lib/python3.12/dist-packages (from anywidget->dialog) (4.15.0)
Requirement already satisfied: einops in /usr/local/lib/python3.12/dist-packages (from etils[enp,epath,epy]->dialog) (0.8.2)
Requirement already satisfied: fsspec in /usr/local/lib/python3.12/dist-packages (from etils[enp,epath,epy]->dialog) (2025.3.0)
Requirement already satisfied: zipp in /usr/local/lib/python3.12/dist-packages (from etils[enp,epath,epy]->dialog) (3.23.0)
Requirement already satisfied: anyio>=4.5 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (4.12.1)
Requirement already satisfied: httpx-sse>=0.4 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (0.4.3)
Requirement already satisfied: httpx>=0.27.1 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (0.28.1)
Requirement already satisfied: jsonschema>=4.20.0 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (4.26.0)
Requirement already satisfied: pydantic-settings>=2.5.2 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (2.13.1)
Requirement already satisfied: pydantic<3.0.0,>=2.11.0 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (2.12.3)
Requirement already satisfied: pyjwt>=2.10.1 in /usr/local/lib/python3.12/dist-packages (from pyjwt[crypto]>=2.10.1->mcp->dialog) (2.12.1)
Requirement already satisfied: python-multipart>=0.0.9 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (0.0.22)
Requirement already satisfied: sse-starlette>=1.6.1 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (3.3.2)
Requirement already satisfied: starlette>=0.27 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (0.52.1)
Requirement already satisfied: typing-inspection>=0.4.1 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (0.4.2)
Requirement already satisfied: uvicorn>=0.31.1 in /usr/local/lib/python3.12/dist-packages (from mcp->dialog) (0.42.0)
Requirement already satisfied: charset_normalizer<4,>=2 in /usr/local/lib/python3.12/dist-packages (from requests->dialog) (3.4.6)
Requirement already satisfied: idna<4,>=2.5 in /usr/local/lib/python3.12/dist-packages (from requests->dialog) (3.11)
Requirement already satisfied: urllib3<3,>=1.21.1 in /usr/local/lib/python3.12/dist-packages (from requests->dialog) (2.5.0)
Requirement already satisfied: certifi>=2017.4.17 in /usr/local/lib/python3.12/dist-packages (from requests->dialog) (2026.2.25)
Requirement already satisfied: httpcore==1.* in /usr/local/lib/python3.12/dist-packages (from httpx>=0.27.1->mcp->dialog) (1.0.9)
Requirement already satisfied: h11>=0.16 in /usr/local/lib/python3.12/dist-packages (from httpcore==1.*->httpx>=0.27.1->mcp->dialog) (0.16.0)
Requirement already satisfied: ipykernel>=4.5.1 in /usr/local/lib/python3.12/dist-packages (from ipywidgets>=7.6.0->anywidget->dialog) (6.17.1)
Requirement already satisfied: ipython-genutils~=0.2.0 in /usr/local/lib/python3.12/dist-packages (from ipywidgets>=7.6.0->anywidget->dialog) (0.2.0)
Requirement already satisfied: traitlets>=4.3.1 in /usr/local/lib/python3.12/dist-packages (from ipywidgets>=7.6.0->anywidget->dialog) (5.7.1)
Requirement already satisfied: widgetsnbextension~=3.6.0 in /usr/local/lib/python3.12/dist-packages (from ipywidgets>=7.6.0->anywidget->dialog) (3.6.10)
Requirement already satisfied: ipython>=4.0.0 in /usr/local/lib/python3.12/dist-packages (from ipywidgets>=7.6.0->anywidget->dialog) (7.34.0)
Requirement already satisfied: jupyterlab-widgets>=1.0.0 in /usr/local/lib/python3.12/dist-packages (from ipywidgets>=7.6.0->anywidget->dialog) (3.0.16)
Requirement already satisfied: attrs>=22.2.0 in /usr/local/lib/python3.12/dist-packages (from jsonschema>=4.20.0->mcp->dialog) (25.4.0)
Requirement already satisfied: jsonschema-specifications>=2023.03.6 in /usr/local/lib/python3.12/dist-packages (from jsonschema>=4.20.0->mcp->dialog) (2025.9.1)
Requirement already satisfied: referencing>=0.28.4 in /usr/local/lib/python3.12/dist-packages (from jsonschema>=4.20.0->mcp->dialog) (0.37.0)
Requirement already satisfied: rpds-py>=0.25.0 in /usr/local/lib/python3.12/dist-packages (from jsonschema>=4.20.0->mcp->dialog) (0.30.0)
Requirement already satisfied: annotated-types>=0.6.0 in /usr/local/lib/python3.12/dist-packages (from pydantic<3.0.0,>=2.11.0->mcp->dialog) (0.7.0)
Requirement already satisfied: pydantic-core==2.41.4 in /usr/local/lib/python3.12/dist-packages (from pydantic<3.0.0,>=2.11.0->mcp->dialog) (2.41.4)
Requirement already satisfied: python-dotenv>=0.21.0 in /usr/local/lib/python3.12/dist-packages (from pydantic-settings>=2.5.2->mcp->dialog) (1.2.2)
Requirement already satisfied: cryptography>=3.4.0 in /usr/local/lib/python3.12/dist-packages (from pyjwt[crypto]>=2.10.1->mcp->dialog) (43.0.3)
Requirement already satisfied: click>=7.0 in /usr/local/lib/python3.12/dist-packages (from uvicorn>=0.31.1->mcp->dialog) (8.3.1)
Requirement already satisfied: cffi>=1.12 in /usr/local/lib/python3.12/dist-packages (from cryptography>=3.4.0->pyjwt[crypto]>=2.10.1->mcp->dialog) (2.0.0)
Requirement already satisfied: debugpy>=1.0 in /usr/local/lib/python3.12/dist-packages (from ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (1.8.15)
Requirement already satisfied: jupyter-client>=6.1.12 in /usr/local/lib/python3.12/dist-packages (from ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (7.4.9)
Requirement already satisfied: matplotlib-inline>=0.1 in /usr/local/lib/python3.12/dist-packages (from ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (0.2.1)
Requirement already satisfied: nest-asyncio in /usr/local/lib/python3.12/dist-packages (from ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (1.6.0)
Requirement already satisfied: packaging in /usr/local/lib/python3.12/dist-packages (from ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (26.0)
Requirement already satisfied: psutil in /usr/local/lib/python3.12/dist-packages (from ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (5.9.5)
Requirement already satisfied: pyzmq>=17 in /usr/local/lib/python3.12/dist-packages (from ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (26.2.1)
Requirement already satisfied: tornado>=6.1 in /usr/local/lib/python3.12/dist-packages (from ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (6.5.1)
Requirement already satisfied: setuptools>=18.5 in /usr/local/lib/python3.12/dist-packages (from ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (75.2.0)
Collecting jedi>=0.16 (from ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog)
  Downloading jedi-0.19.2-py2.py3-none-any.whl.metadata (22 kB)
Requirement already satisfied: decorator in /usr/local/lib/python3.12/dist-packages (from ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (4.4.2)
Requirement already satisfied: pickleshare in /usr/local/lib/python3.12/dist-packages (from ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (0.7.5)
Requirement already satisfied: prompt-toolkit!=3.0.0,!=3.0.1,<3.1.0,>=2.0.0 in /usr/local/lib/python3.12/dist-packages (from ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (3.0.52)
Requirement already satisfied: pygments in /usr/local/lib/python3.12/dist-packages (from ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (2.19.2)
Requirement already satisfied: backcall in /usr/local/lib/python3.12/dist-packages (from ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (0.2.0)
Requirement already satisfied: pexpect>4.3 in /usr/local/lib/python3.12/dist-packages (from ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (4.9.0)
Requirement already satisfied: notebook>=4.4.1 in /usr/local/lib/python3.12/dist-packages (from widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (6.5.7)
Requirement already satisfied: pycparser in /usr/local/lib/python3.12/dist-packages (from cffi>=1.12->cryptography>=3.4.0->pyjwt[crypto]>=2.10.1->mcp->dialog) (3.0)
Requirement already satisfied: parso<0.9.0,>=0.8.4 in /usr/local/lib/python3.12/dist-packages (from jedi>=0.16->ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (0.8.6)
Requirement already satisfied: entrypoints in /usr/local/lib/python3.12/dist-packages (from jupyter-client>=6.1.12->ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (0.4)
Requirement already satisfied: jupyter-core>=4.9.2 in /usr/local/lib/python3.12/dist-packages (from jupyter-client>=6.1.12->ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (5.9.1)
Requirement already satisfied: python-dateutil>=2.8.2 in /usr/local/lib/python3.12/dist-packages (from jupyter-client>=6.1.12->ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (2.9.0.post0)
Requirement already satisfied: jinja2 in /usr/local/lib/python3.12/dist-packages (from notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (3.1.6)
Requirement already satisfied: argon2-cffi in /usr/local/lib/python3.12/dist-packages (from notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (25.1.0)
Requirement already satisfied: nbformat in /usr/local/lib/python3.12/dist-packages (from notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (5.10.4)
Requirement already satisfied: nbconvert>=5 in /usr/local/lib/python3.12/dist-packages (from notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (7.17.0)
Requirement already satisfied: Send2Trash>=1.8.0 in /usr/local/lib/python3.12/dist-packages (from notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (2.1.0)
Requirement already satisfied: terminado>=0.8.3 in /usr/local/lib/python3.12/dist-packages (from notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.18.1)
Requirement already satisfied: prometheus-client in /usr/local/lib/python3.12/dist-packages (from notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.24.1)
Requirement already satisfied: nbclassic>=0.4.7 in /usr/local/lib/python3.12/dist-packages (from notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (1.3.3)
Requirement already satisfied: ptyprocess>=0.5 in /usr/local/lib/python3.12/dist-packages (from pexpect>4.3->ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (0.7.0)
Requirement already satisfied: wcwidth in /usr/local/lib/python3.12/dist-packages (from prompt-toolkit!=3.0.0,!=3.0.1,<3.1.0,>=2.0.0->ipython>=4.0.0->ipywidgets>=7.6.0->anywidget->dialog) (0.6.0)
Requirement already satisfied: platformdirs>=2.5 in /usr/local/lib/python3.12/dist-packages (from jupyter-core>=4.9.2->jupyter-client>=6.1.12->ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (4.9.4)
Requirement already satisfied: notebook-shim>=0.2.3 in /usr/local/lib/python3.12/dist-packages (from nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.2.4)
Requirement already satisfied: beautifulsoup4 in /usr/local/lib/python3.12/dist-packages (from nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (4.13.5)
Requirement already satisfied: bleach!=5.0.0 in /usr/local/lib/python3.12/dist-packages (from bleach[css]!=5.0.0->nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (6.3.0)
Requirement already satisfied: defusedxml in /usr/local/lib/python3.12/dist-packages (from nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.7.1)
Requirement already satisfied: jupyterlab-pygments in /usr/local/lib/python3.12/dist-packages (from nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.3.0)
Requirement already satisfied: markupsafe>=2.0 in /usr/local/lib/python3.12/dist-packages (from nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (3.0.3)
Requirement already satisfied: mistune<4,>=2.0.3 in /usr/local/lib/python3.12/dist-packages (from nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (3.2.0)
Requirement already satisfied: nbclient>=0.5.0 in /usr/local/lib/python3.12/dist-packages (from nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.10.4)
Requirement already satisfied: pandocfilters>=1.4.1 in /usr/local/lib/python3.12/dist-packages (from nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (1.5.1)
Requirement already satisfied: fastjsonschema>=2.15 in /usr/local/lib/python3.12/dist-packages (from nbformat->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (2.21.2)
Requirement already satisfied: six>=1.5 in /usr/local/lib/python3.12/dist-packages (from python-dateutil>=2.8.2->jupyter-client>=6.1.12->ipykernel>=4.5.1->ipywidgets>=7.6.0->anywidget->dialog) (1.17.0)
Requirement already satisfied: argon2-cffi-bindings in /usr/local/lib/python3.12/dist-packages (from argon2-cffi->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (25.1.0)
Requirement already satisfied: webencodings in /usr/local/lib/python3.12/dist-packages (from bleach!=5.0.0->bleach[css]!=5.0.0->nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.5.1)
Requirement already satisfied: tinycss2<1.5,>=1.1.0 in /usr/local/lib/python3.12/dist-packages (from bleach[css]!=5.0.0->nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (1.4.0)
Requirement already satisfied: jupyter-server<3,>=1.8 in /usr/local/lib/python3.12/dist-packages (from notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (2.14.0)
Requirement already satisfied: soupsieve>1.2 in /usr/local/lib/python3.12/dist-packages (from beautifulsoup4->nbconvert>=5->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (2.8.3)
Requirement already satisfied: jupyter-events>=0.9.0 in /usr/local/lib/python3.12/dist-packages (from jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.12.0)
Requirement already satisfied: jupyter-server-terminals>=0.4.4 in /usr/local/lib/python3.12/dist-packages (from jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.5.4)
Requirement already satisfied: overrides>=5.0 in /usr/local/lib/python3.12/dist-packages (from jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (7.7.0)
Requirement already satisfied: websocket-client>=1.7 in /usr/local/lib/python3.12/dist-packages (from jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (1.9.0)
Requirement already satisfied: python-json-logger>=2.0.4 in /usr/local/lib/python3.12/dist-packages (from jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (4.0.0)
Requirement already satisfied: pyyaml>=5.3 in /usr/local/lib/python3.12/dist-packages (from jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (6.0.3)
Requirement already satisfied: rfc3339-validator in /usr/local/lib/python3.12/dist-packages (from jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.1.4)
Requirement already satisfied: rfc3986-validator>=0.1.1 in /usr/local/lib/python3.12/dist-packages (from jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (0.1.1)
Requirement already satisfied: fqdn in /usr/local/lib/python3.12/dist-packages (from jsonschema[format-nongpl]>=4.18.0->jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (1.5.1)
Requirement already satisfied: isoduration in /usr/local/lib/python3.12/dist-packages (from jsonschema[format-nongpl]>=4.18.0->jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (20.11.0)
Requirement already satisfied: jsonpointer>1.13 in /usr/local/lib/python3.12/dist-packages (from jsonschema[format-nongpl]>=4.18.0->jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (3.0.0)
Requirement already satisfied: rfc3987-syntax>=1.1.0 in /usr/local/lib/python3.12/dist-packages (from jsonschema[format-nongpl]>=4.18.0->jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (1.1.0)
Requirement already satisfied: uri-template in /usr/local/lib/python3.12/dist-packages (from jsonschema[format-nongpl]>=4.18.0->jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (1.3.0)
Requirement already satisfied: webcolors>=24.6.0 in /usr/local/lib/python3.12/dist-packages (from jsonschema[format-nongpl]>=4.18.0->jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (25.10.0)
Requirement already satisfied: arrow>=0.15.0 in /usr/local/lib/python3.12/dist-packages (from isoduration->jsonschema[format-nongpl]>=4.18.0->jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (1.4.0)
Requirement already satisfied: tzdata in /usr/local/lib/python3.12/dist-packages (from arrow>=0.15.0->isoduration->jsonschema[format-nongpl]>=4.18.0->jupyter-events>=0.9.0->jupyter-server<3,>=1.8->notebook-shim>=0.2.3->nbclassic>=0.4.7->notebook>=4.4.1->widgetsnbextension~=3.6.0->ipywidgets>=7.6.0->anywidget->dialog) (2025.3)
Downloading dialog-1.0.0-py3-none-any.whl (318 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 318.4/318.4 kB 26.3 MB/s eta 0:00:00
Downloading jedi-0.19.2-py2.py3-none-any.whl (1.6 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.6/1.6 MB 80.7 MB/s eta 0:00:00
Installing collected packages: jedi, dialog
Successfully installed dialog-1.0.0 jedi-0.19.2
```

## Load Model

Use `transformers` library to load the pipeline

    MODEL_ID = "google/gemma-4-E2B-it" # @param ["google/gemma-4-E2B-it","google/gemma-4-E4B-it", "google/gemma-4-31B-it", "google/gemma-4-26B-A4B-it"]

    from transformers import pipeline

    txt_pipe = pipeline(
        task="text-generation",
        model=MODEL_ID,
        device_map="auto",
        dtype="auto"
    )

```
Loading weights:   0%|          | 0/2011 [00:00<?, ?it/s]
```

## Run text generation

Once you have the Gemma model loaded and configured in a `pipeline` object, you can send prompts to the model. The following example code shows a basic request using the `text_inputs` parameter:

    output = txt_pipe(text_inputs="<|turn>user\nRoses are..<turn|>\n<|turn>model\n")
    print(output[0]['generated_text'])

```
Both `max_new_tokens` (=256) and `max_length`(=20) seem to have been set. `max_new_tokens` will take precedence. Please refer to the documentation for more information. (https://huggingface.co/docs/transformers/main/en/main_classes/text_generation)
<|turn>user
Roses are..<turn|>
<|turn>model
Here are a few ways to complete the phrase "Roses are...":

**Classic/Poetic:**

* **Roses are red.** (The most famous completion, though it usually goes "Roses are red, Violets are blue.")
* **Roses are beautiful.**
* **Roses are fragrant.**

**Simple/Direct:**

* **Roses are lovely.**
* **Roses are soft.**

**If you want a specific tone, let me know! 😊**
```

## Use Dialog library

    import dialog
    from transformers import GenerationConfig
    config = GenerationConfig.from_pretrained(MODEL_ID)
    config.max_new_tokens = 512

    conv = dialog.Conversation(
        dialog.User("Roses are...")
    )
    output = txt_pipe(text_inputs=conv.as_text(), return_full_text=False, generation_config=config)
    conv += dialog.Model(output[0]['generated_text'])

    print(conv.as_text())
    conv.show()

```
<|turn>user
Roses are...<turn|>
<|turn>model
Here are a few ways to complete the phrase "Roses are...":

**Focusing on their beauty:**

* **Roses are beautiful.**
* **Roses are gorgeous.**

**Focusing on their scent:**

* **Roses are fragrant.**
* **Roses are sweet-smelling.**

**Focusing on their symbolism (if you want a deeper meaning):**

* **Roses are love.**
* **Roses are romantic.**

**Focusing on a general observation:**

* **Roses are lovely.**
* **Roses are wonderful.**

**Which completion do you like best, or were you thinking of a specific meaning?**
<dialog._src.widget.Conversation object at 0x7f1bb1a5d8b0>
```

## Use a prompt template

When generating content with more complex prompting, use a prompt template to structure your request. A prompt template allows you to specify input from specific roles, such as `user` or `model`, and is a required format for managing multi-turn chat interactions with Gemma models. The following example code shows how to construct a prompt template for Gemma:

    from transformers import GenerationConfig
    config = GenerationConfig.from_pretrained(MODEL_ID)
    config.max_new_tokens = 512

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Write a short poem about the Kraken."},
            ]
        }
    ]

    output = txt_pipe(messages, return_full_text=False, generation_config=config)
    print(output[0]['generated_text'])

```
From sunless depths, a shadow stirs,
Where ocean's crushing silence blurs.
A titan sleeps in inky night,
With tentacles of dreadful might.

A hundred arms, a crushing hold,
A legend whispered, ages old.
The deep's dark king, a monstrous grace,
The Kraken claims its watery space.
```

## Multi-turn conversation

In a multi-turn setup, the conversation history is preserved as a sequence of alternating `user` and `model` roles. This cumulative list serves as the model's memory, ensuring that each new output is informed by the preceding dialogue.

    import dialog
    from transformers import GenerationConfig
    config = GenerationConfig.from_pretrained(MODEL_ID)
    config.max_new_tokens = 512

    # User turn #1
    conv = dialog.Conversation(
        dialog.User("Write a short poem about the Kraken.")
    )

    # Model response #1
    output = txt_pipe(text_inputs=conv.as_text(), return_full_text=False, generation_config=config)
    conv += dialog.Model(output[0]['generated_text'])

    # User turn #2
    conv += dialog.User("Now with the Siren.")

    # Model response #2
    output = txt_pipe(text_inputs=conv.as_text(), return_full_text=False, generation_config=config)
    conv += dialog.Model(output[0]['generated_text'])

    print(conv.as_text())
    conv.show()

```
<|turn>user
Write a short poem about the Kraken.<turn|>
<|turn>model
In depths where sunlight fades,
A monstrous shadow plays.
The Kraken wakes, with churning tide,
A living horror, bold and wide.<turn|>
<|turn>user
Now with the Siren.<turn|>
<|turn>model
Where coral gardens sleep,
And ocean secrets keep,
The Siren calls, with liquid grace,
A haunting melody in place.
<dialog._src.widget.Conversation object at 0x7f1bac3733b0>
```

And here's the conversation exported as text.
>
> > [!NOTE]
> > **Note:** if you set `training=True`, the conversation is assumed to be the full complete example. Always ends with `<turn|>`
>
    chat_history = conv.as_text(training=True)
    print(chat_history)
    print("-"*80)

    # display as Conversation widget
    chat_history

```
<|turn>user
Write a short poem about the Kraken.<turn|>
<|turn>model
In depths where sunlight fades,
A monstrous shadow plays.
The Kraken wakes, with churning tide,
A living horror, bold and wide.<turn|>
<|turn>user
Now with the Siren.<turn|>
<|turn>model
Where coral gardens sleep,
And ocean secrets keep,
The Siren calls, with liquid grace,
A haunting melody in place.<turn|>
---
<dialog._src.widget.ConversationStr object at 0x7f1bb07fa1b0>
```

## System instructions

Use the `system` role to provide the system-level instructions.

    import dialog
    from transformers import GenerationConfig
    config = GenerationConfig.from_pretrained(MODEL_ID)
    config.max_new_tokens = 512

    conv = dialog.Conversation(
        dialog.System("Speak like a pirate."),
        dialog.User("Why is the sky blue?")
    )

    output = txt_pipe(text_inputs=conv.as_text(), return_full_text=False, generation_config=config)
    conv += dialog.Model(output[0]['generated_text'])

    print(conv.as_text())
    conv.show()

```
<|turn>system
Speak like a pirate.<turn|>
<|turn>user
Why is the sky blue?<turn|>
<|turn>model
Ahoy there! Why is the sky blue, ye ask? It be down to the way the sun's light dances through the air!

See, the sunlight we get from the sun ain't just one color; it's a whole spectrum of colors, like a treasure chest filled with all the hues of the rainbow!

Now, the Earth is surrounded by the air, and that air is full of tiny, invisible bits of gas. When the sunlight hits these gas molecules, something magical happens. The colors in that sunlight get scattered all around in every direction!

The blue light, and other colors, get scattered more easily by these air molecules than the other colors. So, when you look up at the sky, your eyes catch all that scattered blue light coming from every direction, and **that's what makes the sky appear blue to us!**

It's a grand display of physics and light, savvy? Now, hoist the colors and enjoy the view!
<dialog._src.widget.Conversation object at 0x7f1bac370110>
```

## Summary and next steps

In this guide, you learned how to perform basic text inference with Gemma 4 using the Hugging Face `transformers` library. You covered:

- Setting up the environment and installing dependencies.
- Loading the model using the `pipeline` abstraction.
- Running basic text generation.
- Using the `dialog` library for conversation tracking.
- Implementing multi-turn conversations and applying system instructions.

### Next Steps

- [Prompt and system instructions](https://ai.google.dev/gemma/docs/core/prompt-formatting-gemma4)
- [Function calling](https://ai.google.dev/gemma/docs/capabilities/function-calling-gemma4)
- [Run Gemma overview](https://ai.google.dev/gemma/docs/run)

# Thinking mode in Gemma

|---|---|---|---|---|
| [![](https://ai.google.dev/static/site-assets/images/docs/notebook-site-button.png)View on ai.google.dev](https://ai.google.dev/gemma/docs/capabilities/thinking) | [![](https://www.tensorflow.org/images/colab_logo_32px.png)Run in Google Colab](https://colab.research.google.com/github/google-gemma/cookbook/blob/main/docs/capabilities/thinking.ipynb) | [![](https://www.kaggle.com/static/images/logos/kaggle-logo-transparent-300.png)Run in Kaggle](https://kaggle.com/kernels/welcome?src=https://github.com/google-gemma/cookbook/blob/main/docs/capabilities/thinking.ipynb) | [![](https://ai.google.dev/images/cloud-icon.svg)Open in Vertex AI](https://console.cloud.google.com/vertex-ai/colab/import/https%3A%2F%2Fraw.githubusercontent.com%2Fgoogle-gemma%2Fcookbook%2Fmain%2Fdocs%2Fcapabilities%2Fthinking.ipynb) | [![](https://www.tensorflow.org/images/GitHub-Mark-32px.png)View source on GitHub](https://github.com/google-gemma/cookbook/blob/main/docs/capabilities/thinking.ipynb) |

Gemma is a family of lightweight, state-of-the-art open models built from the same research and technology used to create the [Gemini](https://deepmind.google/technologies/gemini/#introduction) models. Gemma 4 is designed to be the world's most efficient open-weight model family.

This document demonstrates how to use the thinking capabilities of Gemma 4 to generate reasoning processes before providing a final answer. You will learn how to enable thinking mode for both text-only and multimodal (image-text) tasks using the Hugging Face `transformers` library, and how to parse the output to separate thinking from the answer.

This notebook will run on T4 GPU.

## Install Python packages

Install the Hugging Face libraries required for running the Gemma model and making requests.

    # Install PyTorch & other libraries
    pip install torch accelerate

    # Install the transformers library
    pip install transformers

## Load Model

Use the `transformers` libraries to create an instance of a `processor` and `model` using the `AutoProcessor` and `AutoModelForImageTextToText` classes as shown in the following code example:

    MODEL_ID = "google/gemma-4-E2B-it" # @param ["google/gemma-4-E2B-it","google/gemma-4-E4B-it", "google/gemma-4-31B-it", "google/gemma-4-26B-A4B-it"]

    from transformers import AutoProcessor, AutoModelForMultimodalLM

    model = AutoModelForMultimodalLM.from_pretrained(MODEL_ID, dtype="auto", device_map="auto")
    processor = AutoProcessor.from_pretrained(MODEL_ID)

```
Loading weights:   0%|          | 0/2011 [00:00<?, ?it/s]
```

## A single text inference with Thinking

To generate a response using the model's thinking capabilities, pass `enable_thinking=True`, the processor will insert the correct thinking tokens into the prompt, instructing the model to think before responding.
>
> > [!NOTE]
> > **Note:** We've added an empty thinking token to the chat template for `gemma-4-26B-A4B-it` and `gemma-4-31B-it`. This stabilizes model output by suppressing "ghost" thought channels that may appear even when thinking is deactivated.
>
| Model Size | Thinking State | Template Structure / Output |
|---|---|---|
| **E2B/E4B** | **OFF** | `<|turn>user\n[Prompt]<turn|>\n<|turn>model` |
| **E2B/E4B** | **ON** | `<|turn>system\n<|think|><turn|>\n<|turn>user\n[Prompt]<turn|>\n<|turn>model` |
| **26B/31B** | **OFF** | ⚠️ `<|turn>user\n[Prompt]<turn|>\n<|turn>model\n<|channel>thought\n<channel|>` |
| **26B/31B** | **ON** | `<|turn>system\n<|think|><turn|>\n<|turn>user\n[Prompt]<turn|>\n<|turn>model` |

    from transformers import TextStreamer

    message = [
        {
            "role": "user", "content": "What is the water formula?"
        }
    ]

    text = processor.apply_chat_template(message, tokenize=False, add_generation_prompt=True, enable_thinking=True)
    inputs = processor(text=text, return_tensors="pt").to(model.device)
    input_len = inputs["input_ids"].shape[-1]

    streamer = TextStreamer(processor)
    outputs = model.generate(**inputs, streamer=streamer, max_new_tokens=1024)

```
<bos><|turn>system
<|think|><turn|>
<|turn>user
What is the water formula?<turn|>
<|turn>model
<|channel>thought
Thinking Process:

1.  **Analyze the Request:** The user is asking, "What is the water formula?"
2.  **Interpret the Ambiguity:** The term "water formula" is highly ambiguous. It could refer to several things:
    *   **Chemical Formula:** \\(\text{H}_2\text{O}\\) (the molecular formula).
    *   **Physical/Scientific Formula:** The properties of water (e.g., polarity, hydrogen bonding, specific heat).
    *   **Biological/Chemical Formula:** The role of water in biochemistry (e.g., solvation, hydration shells).
    *   **Mathematical Formula:** Equations relating to water cycles, thermodynamics, or fluid dynamics.
    *   **Culinary/Recipe Formula:** A specific recipe.
    *   **A specific context missing:** Is this related to chemistry, physics, biology, engineering, or something else?
3.  **Determine the Most Likely Interpretation:** In a general knowledge context, when someone asks for a "formula" related to water, they most often mean the fundamental chemical structure.
4.  **Formulate the Primary Answer (Chemical):** State the chemical formula and briefly explain what it represents.
5.  **Address the Ambiguity (Provide Context/Alternatives):** Since the request is vague, offer other possible interpretations so the user can clarify.
6.  **Review Constraints (Self-Correction/Identity Check):** I am Gemma 4, an LLM. I can provide factual information based on my knowledge base. No tools are needed. The answer should be clear and comprehensive.

7.  **Draft the Response Structure:**
    *   Start with the most direct answer (Chemical Formula).
    *   Explain the components and bonding.
    *   Offer context for other possible meanings. (Drafting the final response based on this structure.)<channel|>The term "water formula" can be interpreted in several ways, depending on the context (chemistry, physics, biology, etc.).

Here are the most common interpretations:

### 1. Chemical Formula (The Most Common Answer)

The fundamental chemical formula for water is:


$$\text{H}_2\text{O}$$


*   **H** represents the element **Hydrogen**.
*   **O** represents the element **Oxygen**.

This formula indicates that one molecule of water is composed of two hydrogen atoms covalently bonded to one oxygen atom.

### 2. Molecular Structure and Bonding

Beyond the formula, the "formula" also describes how the atoms interact:

*   **Polarity:** Water is a highly **polar** molecule. Oxygen is much more electronegative than hydrogen, meaning it pulls the shared electrons closer to itself. This creates a partial negative charge (\\(\delta^-\\)) on the oxygen atom and partial positive charges (\\(\delta^+\\)) on the hydrogen atoms.
*   **Hydrogen Bonding:** The polarity allows water molecules to form **hydrogen bonds** with each other. This strong attraction is responsible for water's unique physical properties, such as its high specific heat, its ability to dissolve many substances (its role as a universal solvent), and its high surface tension.

### 3. Formula in Physics/Thermodynamics

If you are referring to a physical formula, it might relate to:

*   **Specific Heat Capacity:** The amount of energy required to raise the temperature of a given mass of water by one degree.
*   **Density and Volume:** Equations relating the mass, volume, and density of water under different temperatures and pressures.

***

**In summary, if you are asking for the basic chemical makeup, the formula is \\(\text{H}_2\text{O}\\).**

If you are looking for a specific formula in a different field (like a mathematical equation or a biological reaction), please provide more context!<turn|>
```

Once the text is generated, the response will contain both the reasoning blocks and the final answer bounded by special tokens. You can use the `parse_response` utility to easily extract them into a dictionary containing `thinking` and `answer`.

    response = processor.decode(outputs[0][input_len:], skip_special_tokens=False)
    result = processor.parse_response(response)

    for key, value in result.items():
      if key == "role":
        print(f"Role: {value}")
      elif key == "thinking":
        print(f"\n=== Thoughts ===\n{value}")
      elif key == "content":
        print(f"\n=== Answer ===\n{value}")
      elif key == "tool_calls":
        print(f"\n=== Tool Calls ===\n{value}")
      else:
        print(f"\n{key}: {value}...\n")

```
Role: assistant

=== Thoughts ===
Thinking Process:

1.  **Analyze the Request:** The user is asking, "What is the water formula?"
2.  **Interpret the Ambiguity:** The term "water formula" is highly ambiguous. It could refer to several things:
    *   **Chemical Formula:** \\(\text{H}_2\text{O}\\) (the molecular formula).
    *   **Physical/Scientific Formula:** The properties of water (e.g., polarity, hydrogen bonding, specific heat).
    *   **Biological/Chemical Formula:** The role of water in biochemistry (e.g., solvation, hydration shells).
    *   **Mathematical Formula:** Equations relating to water cycles, thermodynamics, or fluid dynamics.
    *   **Culinary/Recipe Formula:** A specific recipe.
    *   **A specific context missing:** Is this related to chemistry, physics, biology, engineering, or something else?
3.  **Determine the Most Likely Interpretation:** In a general knowledge context, when someone asks for a "formula" related to water, they most often mean the fundamental chemical structure.
4.  **Formulate the Primary Answer (Chemical):** State the chemical formula and briefly explain what it represents.
5.  **Address the Ambiguity (Provide Context/Alternatives):** Since the request is vague, offer other possible interpretations so the user can clarify.
6.  **Review Constraints (Self-Correction/Identity Check):** I am Gemma 4, an LLM. I can provide factual information based on my knowledge base. No tools are needed. The answer should be clear and comprehensive.

7.  **Draft the Response Structure:**
    *   Start with the most direct answer (Chemical Formula).
    *   Explain the components and bonding.
    *   Offer context for other possible meanings. (Drafting the final response based on this structure.)

=== Answer ===
The term "water formula" can be interpreted in several ways, depending on the context (chemistry, physics, biology, etc.).

Here are the most common interpretations:

### 1. Chemical Formula (The Most Common Answer)

The fundamental chemical formula for water is:


$$\text{H}_2\text{O}$$


*   **H** represents the element **Hydrogen**.
*   **O** represents the element **Oxygen**.

This formula indicates that one molecule of water is composed of two hydrogen atoms covalently bonded to one oxygen atom.

### 2. Molecular Structure and Bonding

Beyond the formula, the "formula" also describes how the atoms interact:

*   **Polarity:** Water is a highly **polar** molecule. Oxygen is much more electronegative than hydrogen, meaning it pulls the shared electrons closer to itself. This creates a partial negative charge (\\(\delta^-\\)) on the oxygen atom and partial positive charges (\\(\delta^+\\)) on the hydrogen atoms.
*   **Hydrogen Bonding:** The polarity allows water molecules to form **hydrogen bonds** with each other. This strong attraction is responsible for water's unique physical properties, such as its high specific heat, its ability to dissolve many substances (its role as a universal solvent), and its high surface tension.

### 3. Formula in Physics/Thermodynamics

If you are referring to a physical formula, it might relate to:

*   **Specific Heat Capacity:** The amount of energy required to raise the temperature of a given mass of water by one degree.
*   **Density and Volume:** Equations relating the mass, volume, and density of water under different temperatures and pressures.

***

**In summary, if you are asking for the basic chemical makeup, the formula is \\(\text{H}_2\text{O}\\).**

If you are looking for a specific formula in a different field (like a mathematical equation or a biological reaction), please provide more context!
```

## A single image inference

The procedure for using the thinking model with visual data is very similar. You can provide an image as part of the `messages` array. Just ensure you pass the image to the processor along with the formatted text, and the model will reason about the visual input before responding.

    from PIL import Image
    import matplotlib.pyplot as plt

    prompt = "What is shown in this image?"
    image_url = "https://raw.githubusercontent.com/google-gemma/cookbook/refs/heads/main/Demos/sample-data/GoldenGate.png"

    # download image
    !wget -q {image_url} -O image.png
    image = Image.open("image.png")

    # Display all images
    print("=== Downloaded image ===")
    fig, ax = plt.subplots(1, 1, figsize=(5, 5))
    ax.imshow(image)
    ax.set_title("Image 1")
    ax.axis("off")
    plt.tight_layout()
    plt.show()

    message = [
        {
            "role": "user", "content": [
              {"type": "image"},
              {"type": "text", "text": prompt}
            ]
        }
    ]

    text = processor.apply_chat_template(message, tokenize=False, add_generation_prompt=True, enable_thinking=True)
    inputs = processor(text=text, images=image, return_tensors="pt").to(model.device)
    input_len = inputs["input_ids"].shape[-1]

    outputs = model.generate(**inputs, max_new_tokens=1024)
    response = processor.decode(outputs[0][input_len:], skip_special_tokens=False)

    result = processor.parse_response(response)

    for key, value in result.items():
      if key == "role":
        print(f"Role: {value}")
      elif key == "thinking":
        print(f"\n=== Thoughts ===\n{value}")
      elif key == "content":
        print(f"\n=== Answer ===\n{value}")
      elif key == "tool_calls":
        print(f"\n=== Tool Calls ===\n{value}")
      else:
        print(f"\n{key}: {value}...\n")

```
=== Downloaded image ===
```

![png](https://ai.google.dev/static/gemma/docs/capabilities/thinking_files/output_WZg8nr-FEwOe_1.png)

```
Role: assistant

=== Thoughts ===
Here's a thinking process to arrive at the suggested description:

1.  **Analyze the Image Content:**
    *   **Dominant Feature:** A large suspension bridge with distinctive red/orange trusswork. This is immediately recognizable as the Golden Gate Bridge.
    *   **Setting:** Water (a large body of water, likely the bay/ocean).
    *   **Foreground/Midground:**
        *   Water in the immediate foreground (dark blue/green).
        *   A rocky outcrop/island in the middle foreground.
        *   A substantial stone/brick structure to the left (part of the bridge approach or a related structure).
    *   **Background:** Hazy landmasses/hills behind the bridge.
    *   **Sky:** Clear, light blue sky.
    *   **Atmosphere/Lighting:** Bright daylight, clear weather.

2.  **Identify Key Elements for Description:**
    *   The Bridge (Golden Gate Bridge).
    *   The Water/Bay.
    *   The Coastal/Land features.

3.  **Draft the Description (Focusing on detail and clarity):**
    *   *Initial thought:* It's a picture of the Golden Gate Bridge over the water.
    *   *Refinement (Adding detail):* The image shows the iconic red suspension bridge spanning a body of water. There is a rocky island in the foreground and some structures on the shore.
    *   *Enhancement (Adding context and visual appeal):* Mention the color, the scale, and the atmosphere.

4.  **Final Polish and Structure (Grouping similar ideas):** (This leads to the final structured response.)

    *   *Identification:* State clearly what the main subject is.
    *   *Setting:* Describe the environment (water, sky).
    *   *Details:* Mention specific foreground and background elements.

5.  **Review against the original prompt:** (The prompt asks "What is shown in this image?") The description accurately reflects the visual evidence. (Self-Correction: Ensure the identification is confident, which it is, based on the structure and color.)

=== Answer ===
This image shows the **Golden Gate Bridge** spanning a body of water, likely the San Francisco Bay.

Here is a breakdown of what is visible:

* **The Golden Gate Bridge:** The iconic red/orange suspension bridge dominates the frame, stretching across the water. Its distinctive structure and massive towers are clearly visible.
* **Water:** A large expanse of blue-green water fills the foreground and midground.
* **Foreground Elements:** In the immediate foreground, there is a dark, rocky outcrop or small island.
* **Shoreline/Structures:** To the left, there are stone and brick structures, suggesting the land or approach to the bridge.
* **Background:** Hazy hills or landmasses are visible in the distance behind the bridge.
* **Atmosphere:** The scene is brightly lit under a clear, light blue sky, suggesting fair weather.

In summary, it is a scenic photograph capturing the majestic view of the Golden Gate Bridge.
```

## Summary and next steps

In this guide, you learned how to use the thinking capabilities of Gemma 4 models to generate reasoning processes before final answers. You covered:

- Enabling thinking mode using `enable_thinking=True` in `apply_chat_template`.
- Using `TextStreamer` to observe the thinking process in real-time.
- Parsing the combined output into separate `thinking` and `answer` blocks using `parse_response`.
- Applying thinking capabilities to multimodal tasks (image + text).

### Next Steps

Explore more capabilities of Gemma 4:

- [Prompt and system instructions](https://ai.google.dev/gemma/docs/core/prompt-formatting-gemma4)
- [Function calling](https://ai.google.dev/gemma/docs/capabilities/function-calling-gemma4)
- [Run Gemma overview](https://ai.google.dev/gemma/docs/run)

