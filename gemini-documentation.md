# Grounding with Google Search connects the Gemini model to real-time web content
and works with all available languages. This allows
Gemini to provide more accurate answers and cite verifiable sources beyond its
knowledge cutoff.

Grounding helps you build applications that can:

- **Increase factual accuracy:** Reduce model hallucinations by basing responses on real-world information.
- **Access real-time information:** Answer questions about recent events and topics.
- **Provide citations:** Build user trust by showing the sources for the
  model's claims.

### Python

    from google import genai
    from google.genai import types

    client = genai.Client()

    grounding_tool = types.Tool(
        google_search=types.GoogleSearch()
    )

    config = types.GenerateContentConfig(
        tools=[grounding_tool]
    )

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="Who won the euro 2024?",
        config=config,
    )

    print(response.text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    const groundingTool = {
      googleSearch: {},
    };

    const config = {
      tools: [groundingTool],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Who won the euro 2024?",
      config,
    });

    console.log(response.text);

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -X POST \
      -d '{
        "contents": [
          {
            "parts": [
              {"text": "Who won the euro 2024?"}
            ]
          }
        ],
        "tools": [
          {
            "google_search": {}
          }
        ]
      }'

You can learn more by trying the [Search tool
notebook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Search_Grounding.ipynb).

## How grounding with Google Search works

When you enable the `google_search` tool, the model handles the entire workflow
of searching, processing, and citing information automatically.

![grounding-overview](https://ai.google.dev/static/gemini-api/docs/images/google-search-tool-overview.png)

1. **User Prompt:** Your application sends a user's prompt to the Gemini API with the `google_search` tool enabled.
2. **Prompt Analysis:** The model analyzes the prompt and determines if a Google Search can improve the answer.
3. **Google Search:** If needed, the model automatically generates one or multiple search queries and executes them.
4. **Search Results Processing:** The model processes the search results, synthesizes the information, and formulates a response.
5. **Grounded Response:** The API returns a final, user-friendly response that is grounded in the search results. This response includes the model's text answer and `groundingMetadata` with the search queries, web results, and citations.

## Understanding the grounding response

When a response is successfully grounded, the response includes a
`groundingMetadata` field. This structured data is essential for verifying
claims and building a rich citation experience in your application.

    {
      "candidates": [
        {
          "content": {
            "parts": [
              {
                "text": "Spain won Euro 2024, defeating England 2-1 in the final. This victory marks Spain's record fourth European Championship title."
              }
            ],
            "role": "model"
          },
          "groundingMetadata": {
            "webSearchQueries": [
              "UEFA Euro 2024 winner",
              "who won euro 2024"
            ],
            "searchEntryPoint": {
              "renderedContent": "<!-- HTML and CSS for the search widget -->"
            },
            "groundingChunks": [
              {"web": {"uri": "https://vertexaisearch.cloud.google.com.....", "title": "aljazeera.com"}},
              {"web": {"uri": "https://vertexaisearch.cloud.google.com.....", "title": "uefa.com"}}
            ],
            "groundingSupports": [
              {
                "segment": {"startIndex": 0, "endIndex": 85, "text": "Spain won Euro 2024, defeatin..."},
                "groundingChunkIndices": [0]
              },
              {
                "segment": {"startIndex": 86, "endIndex": 210, "text": "This victory marks Spain's..."},
                "groundingChunkIndices": [0, 1]
              }
            ]
          }
        }
      ]
    }

The Gemini API returns the following information with the `groundingMetadata`:

- `webSearchQueries` : Array of the search queries used. This is useful for debugging and understanding the model's reasoning process.
- `searchEntryPoint` : Contains the HTML and CSS to render the required Search Suggestions. Full usage requirements are detailed in the [Terms of
  Service](https://ai.google.dev/gemini-api/terms#grounding-with-google-search).
- `groundingChunks` : Array of objects containing the web sources (`uri` and `title`).
- `groundingSupports` : Array of chunks to connect model response `text` to the sources in `groundingChunks`. Each chunk links a text `segment` (defined by `startIndex` and `endIndex`) to one or more `groundingChunkIndices`. This is the key to building inline citations.

Grounding with Google Search can also be used in combination with the [URL
context tool](https://ai.google.dev/gemini-api/docs/url-context) to ground responses in both public
web data and the specific URLs you provide.

## Attributing sources with inline citations

The API returns structured citation data, giving you complete control over how
you display sources in your user interface. You can use the `groundingSupports`
and `groundingChunks` fields to link the model's statements directly to their
sources. Here is a common pattern for processing the metadata to create a
response with inline, clickable citations.

### Python

    def add_citations(response):
        text = response.text
        supports = response.candidates[0].grounding_metadata.grounding_supports
        chunks = response.candidates[0].grounding_metadata.grounding_chunks

        # Sort supports by end_index in descending order to avoid shifting issues when inserting.
        sorted_supports = sorted(supports, key=lambda s: s.segment.end_index, reverse=True)

        for support in sorted_supports:
            end_index = support.segment.end_index
            if support.grounding_chunk_indices:
                # Create citation string like [1](link1)[2](link2)
                citation_links = []
                for i in support.grounding_chunk_indices:
                    if i < len(chunks):
                        uri = chunks[i].web.uri
                        citation_links.append(f"[{i + 1}]({uri})")

                citation_string = ", ".join(citation_links)
                text = text[:end_index] + citation_string + text[end_index:]

        return text

    # Assuming response with grounding metadata
    text_with_citations = add_citations(response)
    print(text_with_citations)

### JavaScript

    function addCitations(response) {
        let text = response.text;
        const supports = response.candidates[0]?.groundingMetadata?.groundingSupports;
        const chunks = response.candidates[0]?.groundingMetadata?.groundingChunks;

        // Sort supports by end_index in descending order to avoid shifting issues when inserting.
        const sortedSupports = [...supports].sort(
            (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
        );

        for (const support of sortedSupports) {
            const endIndex = support.segment?.endIndex;
            if (endIndex === undefined || !support.groundingChunkIndices?.length) {
            continue;
            }

            const citationLinks = support.groundingChunkIndices
            .map(i => {
                const uri = chunks[i]?.web?.uri;
                if (uri) {
                return `[${i + 1}](${uri})`;
                }
                return null;
            })
            .filter(Boolean);

            if (citationLinks.length > 0) {
            const citationString = citationLinks.join(", ");
            text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
            }
        }

        return text;
    }

    const textWithCitations = addCitations(response);
    console.log(textWithCitations);

The new response with inline citations will look like this:

    Spain won Euro 2024, defeating England 2-1 in the final.[1](https:/...), [2](https:/...), [4](https:/...), [5](https:/...) This victory marks Spain's record-breaking fourth European Championship title.[5]((https:/...), [2](https:/...), [3](https:/...), [4](https:/...)

## Pricing

When you use Grounding with Google Search with Gemini 3, your project is billed
for each search query that the model decides to execute. If the model decides to
execute multiple search queries to answer a single prompt (for example,
searching for `"UEFA Euro 2024 winner"` and `"Spain vs England Euro 2024 final
score"` within the same API call), this counts as two billable uses of the tool
for that request. For billing purposes, we ignore the empty web search queries
when counting unique queries. This billing model only applies to Gemini 3
models; when you use search grounding with Gemini 2.5 or older models, your
project is billed per prompt.

For detailed pricing information, see the [Gemini API pricing
page](https://ai.google.dev/gemini-api/docs/pricing).

## Supported models

You can find full capabilities on the [model
overview](https://ai.google.dev/gemini-api/docs/models) page.

| Model | Grounding with Google Search |
|---|---|
| Gemini 3.1 Flash Image Preview | ✔️ |
| Gemini 3.1 Pro Preview | ✔️ |
| Gemini 3 Pro Image Preview | ✔️ |
| Gemini 3 Flash Preview | ✔️ |
| Gemini 2.5 Pro | ✔️ |
| Gemini 2.5 Flash | ✔️ |
| Gemini 2.5 Flash-Lite | ✔️ |
| Gemini 2.0 Flash | ✔️ |

> [!NOTE]
> **Note:** Older models use a `google_search_retrieval` tool. For all current models, use the `google_search` tool as shown in the examples.

## Supported tool combinations

You can use Grounding with Google Search with other tools like
[code execution](https://ai.google.dev/gemini-api/docs/code-execution) and
[URL context](https://ai.google.dev/gemini-api/docs/url-context) to power more complex use cases.

Gemini 3 models support combining built-in tools (like Grounding with Google
Search) with custom tools (function calling). Learn more on the
[tool combinations](https://ai.google.dev/gemini-api/docs/tool-combination) page.

## What's next

- Try the [Grounding with Google Search in the Gemini API
  Cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Search_Grounding.ipynb).
- Learn about other available tools, like [Function Calling](https://ai.google.dev/gemini-api/docs/function-calling).
- Learn how to augment prompts with specific URLs using the [URL context
  tool](https://ai.google.dev/gemini-api/docs/url-context).

  # Gemini thinking

The [Gemini 3 and 2.5 series models](https://ai.google.dev/gemini-api/docs/models) use an internal
"thinking process" that significantly improves their reasoning and multi-step
planning abilities, making them highly effective for complex tasks such as
coding, advanced mathematics, and data analysis.

This guide shows you how to work with Gemini's thinking capabilities using the
Gemini API.

## Generating content with thinking

Initiating a request with a thinking model is similar to any other content
generation request. The key difference lies in specifying one of the
[models with thinking support](https://ai.google.dev/gemini-api/docs/thinking#supported-models) in the `model` field, as
demonstrated in the following [text generation](https://ai.google.dev/gemini-api/docs/text-generation#text-input) example:

### Python

    from google import genai

    client = genai.Client()
    prompt = "Explain the concept of Occam's Razor and provide a simple, everyday example."
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt
    )

    print(response.text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const prompt = "Explain the concept of Occam's Razor and provide a simple, everyday example.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      console.log(response.text);
    }

    main();

### Go

    package main

    import (
      "context"
      "fmt"
      "log"
      "os"
      "google.golang.org/genai"
    )

    func main() {
      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      prompt := "Explain the concept of Occam's Razor and provide a simple, everyday example."
      model := "gemini-3-flash-preview"

      resp, _ := client.Models.GenerateContent(ctx, model, genai.Text(prompt), nil)

      fmt.Println(resp.Text())
    }

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
     -H "x-goog-api-key: $GEMINI_API_KEY" \
     -H 'Content-Type: application/json' \
     -X POST \
     -d '{
       "contents": [
         {
           "parts": [
             {
               "text": "Explain the concept of Occam'\''s Razor and provide a simple, everyday example."
             }
           ]
         }
       ]
     }'
     ```

## Thought summaries

Thought summaries are summarized versions of the model's raw thoughts and offer
insights into the model's internal reasoning process. Note that
thinking levels and budgets apply to the model's raw thoughts and not to thought
summaries.

You can enable thought summaries by setting `includeThoughts` to `true` in your
request configuration. You can then access the summary by iterating through the
`response` parameter's `parts`, and checking the `thought` boolean.

Here's an example demonstrating how to enable and retrieve thought summaries
without streaming, which returns a single, final thought summary with the
response:

### Python

    from google import genai
    from google.genai import types

    client = genai.Client()
    prompt = "What is the sum of the first 50 prime numbers?"
    response = client.models.generate_content(
      model="gemini-3-flash-preview",
      contents=prompt,
      config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
          include_thoughts=True
        )
      )
    )

    for part in response.candidates[0].content.parts:
      if not part.text:
        continue
      if part.thought:
        print("Thought summary:")
        print(part.text)
        print()
      else:
        print("Answer:")
        print(part.text)
        print()

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "What is the sum of the first 50 prime numbers?",
        config: {
          thinkingConfig: {
            includeThoughts: true,
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (!part.text) {
          continue;
        }
        else if (part.thought) {
          console.log("Thoughts summary:");
          console.log(part.text);
        }
        else {
          console.log("Answer:");
          console.log(part.text);
        }
      }
    }

    main();

### Go

    package main

    import (
      "context"
      "fmt"
      "google.golang.org/genai"
      "os"
    )

    func main() {
      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      contents := genai.Text("What is the sum of the first 50 prime numbers?")
      model := "gemini-3-flash-preview"
      resp, _ := client.Models.GenerateContent(ctx, model, contents, &genai.GenerateContentConfig{
        ThinkingConfig: &genai.ThinkingConfig{
          IncludeThoughts: true,
        },
      })

      for _, part := range resp.Candidates[0].Content.Parts {
        if part.Text != "" {
          if part.Thought {
            fmt.Println("Thoughts Summary:")
            fmt.Println(part.Text)
          } else {
            fmt.Println("Answer:")
            fmt.Println(part.Text)
          }
        }
      }
    }

And here is an example using thinking with streaming, which returns rolling,
incremental summaries during generation:

### Python

    from google import genai
    from google.genai import types

    client = genai.Client()

    prompt = """
    Alice, Bob, and Carol each live in a different house on the same street: red, green, and blue.
    The person who lives in the red house owns a cat.
    Bob does not live in the green house.
    Carol owns a dog.
    The green house is to the left of the red house.
    Alice does not own a cat.
    Who lives in each house, and what pet do they own?
    """

    thoughts = ""
    answer = ""

    for chunk in client.models.generate_content_stream(
        model="gemini-3-flash-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
          thinking_config=types.ThinkingConfig(
            include_thoughts=True
          )
        )
    ):
      for part in chunk.candidates[0].content.parts:
        if not part.text:
          continue
        elif part.thought:
          if not thoughts:
            print("Thoughts summary:")
          print(part.text)
          thoughts += part.text
        else:
          if not answer:
            print("Answer:")
          print(part.text)
          answer += part.text

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    const prompt = `Alice, Bob, and Carol each live in a different house on the same
    street: red, green, and blue. The person who lives in the red house owns a cat.
    Bob does not live in the green house. Carol owns a dog. The green house is to
    the left of the red house. Alice does not own a cat. Who lives in each house,
    and what pet do they own?`;

    let thoughts = "";
    let answer = "";

    async function main() {
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          thinkingConfig: {
            includeThoughts: true,
          },
        },
      });

      for await (const chunk of response) {
        for (const part of chunk.candidates[0].content.parts) {
          if (!part.text) {
            continue;
          } else if (part.thought) {
            if (!thoughts) {
              console.log("Thoughts summary:");
            }
            console.log(part.text);
            thoughts = thoughts + part.text;
          } else {
            if (!answer) {
              console.log("Answer:");
            }
            console.log(part.text);
            answer = answer + part.text;
          }
        }
      }
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "log"
      "os"
      "google.golang.org/genai"
    )

    const prompt = `
    Alice, Bob, and Carol each live in a different house on the same street: red, green, and blue.
    The person who lives in the red house owns a cat.
    Bob does not live in the green house.
    Carol owns a dog.
    The green house is to the left of the red house.
    Alice does not own a cat.
    Who lives in each house, and what pet do they own?
    `

    func main() {
      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      contents := genai.Text(prompt)
      model := "gemini-3-flash-preview"

      resp := client.Models.GenerateContentStream(ctx, model, contents, &genai.GenerateContentConfig{
        ThinkingConfig: &genai.ThinkingConfig{
          IncludeThoughts: true,
        },
      })

      for chunk := range resp {
        for _, part := range chunk.Candidates[0].Content.Parts {
          if len(part.Text) == 0 {
            continue
          }

          if part.Thought {
            fmt.Printf("Thought: %s\n", part.Text)
          } else {
            fmt.Printf("Answer: %s\n", part.Text)
          }
        }
      }
    }

## Controlling thinking

Gemini models engage in dynamic thinking by default, automatically adjusting the
amount of reasoning effort based on the complexity of the user's request.
However, if you have specific latency constraints or require the model to engage
in deeper reasoning than usual, you can optionally use parameters to control
thinking behavior.

### Thinking levels (Gemini 3)

The `thinkingLevel` parameter, recommended for Gemini 3 models and onwards,
lets you control reasoning behavior.

The following table details the `thinkingLevel` settings for each model type:

| Thinking Level | Gemini 3.1 Pro | Gemini 3.1 Flash-Lite | Gemini 3 Flash | Description |
|---|---|---|---|---|
| **`minimal`** | Not supported | Supported (Default) | Supported | Matches the "no thinking" setting for most queries. The model may think very minimally for complex coding tasks. Minimizes latency for chat or high throughput applications. Note, `minimal` does not guarantee that thinking is off. |
| **`low`** | Supported | Supported | Supported | Minimizes latency and cost. Best for simple instruction following, chat, or high-throughput applications. |
| **`medium`** | Supported | Supported | Supported | Balanced thinking for most tasks. |
| **`high`** | Supported (Default, Dynamic) | Supported (Dynamic) | Supported (Default, Dynamic) | Maximizes reasoning depth. The model may take significantly longer to reach a first (non thinking) output token, but the output will be more carefully reasoned. |

The following example shows how to set the thinking level.

### Python

    from google import genai
    from google.genai import types

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="Provide a list of 3 famous physicists and their key contributions",
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_level="low")
        ),
    )

    print(response.text)

### JavaScript

    import { GoogleGenAI, ThinkingLevel } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Provide a list of 3 famous physicists and their key contributions",
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      console.log(response.text);
    }

    main();

### Go

    package main

    import (
      "context"
      "fmt"
      "google.golang.org/genai"
      "os"
    )

    func main() {
      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      thinkingLevelVal := "low"

      contents := genai.Text("Provide a list of 3 famous physicists and their key contributions")
      model := "gemini-3-flash-preview"
      resp, _ := client.Models.GenerateContent(ctx, model, contents, &genai.GenerateContentConfig{
        ThinkingConfig: &genai.ThinkingConfig{
          ThinkingLevel: &thinkingLevelVal,
        },
      })

    fmt.Println(resp.Text())
    }

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [
        {
          "parts": [
            {
              "text": "Provide a list of 3 famous physicists and their key contributions"
            }
          ]
        }
      ],
      "generationConfig": {
        "thinkingConfig": {
              "thinkingLevel": "low"
        }
      }
    }'

You cannot disable thinking for Gemini 3.1 Pro. Gemini 3 Flash and Flash-Lite
also do not support full thinking-off, but the `minimal`
setting means the model likely will not think (though it still potentially can).
If you don't specify a thinking level, Gemini will use the Gemini 3 models'
default dynamic thinking level, `"high"`.

Gemini 2.5 series models don't support `thinkingLevel`; use `thinkingBudget`
instead.

### Thinking budgets

The `thinkingBudget` parameter, introduced with the Gemini 2.5 series, guides
the model on the specific number of thinking tokens to use for reasoning.

> [!NOTE]
> **Note:** Use the `thinkingLevel` parameter with Gemini 3 models. While `thinkingBudget` is accepted for backwards compatibility, using it with Gemini 3 Pro may result in unexpected performance.

The following are `thinkingBudget` configuration details for each model type.
You can disable thinking by setting `thinkingBudget` to 0.
Setting the `thinkingBudget` to -1 turns
on **dynamic thinking**, meaning the model will adjust the budget based on the
complexity of the request.

| Model | Default setting (Thinking budget is not set) | Range | Disable thinking | Turn on dynamic thinking |
|---|---|---|---|---|
| **2.5 Pro** | Dynamic thinking | `128` to `32768` | N/A: Cannot disable thinking | `thinkingBudget = -1` (Default) |
| **2.5 Flash** | Dynamic thinking | `0` to `24576` | `thinkingBudget = 0` | `thinkingBudget = -1` (Default) |
| **2.5 Flash Preview** | Dynamic thinking | `0` to `24576` | `thinkingBudget = 0` | `thinkingBudget = -1` (Default) |
| **2.5 Flash Lite** | Model does not think | `512` to `24576` | `thinkingBudget = 0` | `thinkingBudget = -1` |
| **2.5 Flash Lite Preview** | Model does not think | `512` to `24576` | `thinkingBudget = 0` | `thinkingBudget = -1` |
| **Robotics-ER 1.5 Preview** | Dynamic thinking | `0` to `24576` | `thinkingBudget = 0` | `thinkingBudget = -1` (Default) |
| **2.5 Flash Live Native Audio Preview (09-2025)** | Dynamic thinking | `0` to `24576` | `thinkingBudget = 0` | `thinkingBudget = -1` (Default) |

### Python

    from google import genai
    from google.genai import types

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Provide a list of 3 famous physicists and their key contributions",
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=1024)
            # Turn off thinking:
            # thinking_config=types.ThinkingConfig(thinking_budget=0)
            # Turn on dynamic thinking:
            # thinking_config=types.ThinkingConfig(thinking_budget=-1)
        ),
    )

    print(response.text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Provide a list of 3 famous physicists and their key contributions",
        config: {
          thinkingConfig: {
            thinkingBudget: 1024,
            // Turn off thinking:
            // thinkingBudget: 0
            // Turn on dynamic thinking:
            // thinkingBudget: -1
          },
        },
      });

      console.log(response.text);
    }

    main();

### Go

    package main

    import (
      "context"
      "fmt"
      "google.golang.org/genai"
      "os"
    )

    func main() {
      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      thinkingBudgetVal := int32(1024)

      contents := genai.Text("Provide a list of 3 famous physicists and their key contributions")
      model := "gemini-2.5-flash"
      resp, _ := client.Models.GenerateContent(ctx, model, contents, &genai.GenerateContentConfig{
        ThinkingConfig: &genai.ThinkingConfig{
          ThinkingBudget: &thinkingBudgetVal,
          // Turn off thinking:
          // ThinkingBudget: int32(0),
          // Turn on dynamic thinking:
          // ThinkingBudget: int32(-1),
        },
      })

    fmt.Println(resp.Text())
    }

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [
        {
          "parts": [
            {
              "text": "Provide a list of 3 famous physicists and their key contributions"
            }
          ]
        }
      ],
      "generationConfig": {
        "thinkingConfig": {
              "thinkingBudget": 1024
        }
      }
    }'

Depending on the prompt, the model might overflow or underflow the token budget.

## Thought signatures

> [!IMPORTANT]
> **Important:** The [Google GenAI SDK](https://ai.google.dev/gemini-api/docs/libraries) automatically handles the return of thought signatures for you. You only need to [manage thought signatures manually](https://ai.google.dev/gemini-api/docs/function-calling#thought-signatures) if you're modifying conversation history or using the REST API.

The Gemini API is stateless, so the model treats every API request independently
and doesn't have access to thought context from previous turns in multi-turn
interactions.

In order to enable maintaining thought context across multi-turn interactions,
Gemini returns thought signatures, which are encrypted representations of the
model's internal thought process.

- **Gemini 2.5 models** return thought signatures when thinking is enabled and the request includes [function calling](https://ai.google.dev/gemini-api/docs/function-calling#thinking), specifically [function declarations](https://ai.google.dev/gemini-api/docs/function-calling#step-2).
- **Gemini 3 models** may return thought signatures for all types of [parts](https://ai.google.dev/api/caching#Part). We recommend you always pass all signatures back as received, but it's *required* for function calling signatures. Read the [Thought Signatures](https://ai.google.dev/gemini-api/docs/thought-signatures) page to learn more.

Other usage limitations to consider with function calling include:

- Signatures are returned from the model within other parts in the response, for example function calling or text parts. [Return the entire response](https://ai.google.dev/gemini-api/docs/function-calling#step-4) with all parts back to the model in subsequent turns.
- Don't concatenate parts with signatures together.
- Don't merge one part with a signature with another part without a signature.

## Pricing

> [!NOTE]
> **Note:** **Summaries** are available in the [free and paid tiers](https://ai.google.dev/gemini-api/docs/pricing) of the API. **Thought signatures** will increase the input tokens you are charged when sent back as part of the request.

When thinking is turned on, response pricing is the sum of output
tokens and thinking tokens. You can get the total number of generated thinking
tokens from the `thoughtsTokenCount` field.

### Python

    # ...
    print("Thoughts tokens:",response.usage_metadata.thoughts_token_count)
    print("Output tokens:",response.usage_metadata.candidates_token_count)

### JavaScript

    // ...
    console.log(`Thoughts tokens: ${response.usageMetadata.thoughtsTokenCount}`);
    console.log(`Output tokens: ${response.usageMetadata.candidatesTokenCount}`);

### Go

    // ...
    usageMetadata, err := json.MarshalIndent(response.UsageMetadata, "", "  ")
    if err != nil {
      log.Fatal(err)
    }
    fmt.Println("Thoughts tokens:", string(usageMetadata.thoughts_token_count))
    fmt.Println("Output tokens:", string(usageMetadata.candidates_token_count))

Thinking models generate full thoughts to improve the quality of the final
response, and then output [summaries](https://ai.google.dev/gemini-api/docs/thinking#summaries) to provide insight into the
thought process. So, pricing is based on the full thought tokens the
model needs to generate to create a summary, despite only the summary being
output from the API.

You can learn more about tokens in the [Token counting](https://ai.google.dev/gemini-api/docs/tokens)
guide.

## Best practices

This section includes some guidance for using thinking models efficiently.
As always, following our [prompting guidance and best practices](https://ai.google.dev/gemini-api/docs/prompting-strategies) will get you the best results.

### Debugging and steering

- **Review reasoning**: When you're not getting your expected response from the
  thinking models, it can help to carefully analyze Gemini's thought summaries.
  You can see how it broke down the task and arrived at its conclusion, and use
  that information to correct towards the right results.

- **Provide Guidance in Reasoning** : If you're hoping for a particularly lengthy
  output, you may want to provide guidance in your prompt to constrain the
  [amount of thinking](https://ai.google.dev/gemini-api/docs/thinking#set-budget) the model uses. This lets you reserve more
  of the token output for your response.

### Task complexity

- **Easy Tasks (Thinking could be OFF):** For straightforward requests where complex reasoning isn't required, such as fact retrieval or classification, thinking is not required. Examples include:
  - "Where was DeepMind founded?"
  - "Is this email asking for a meeting or just providing information?"
- **Medium Tasks (Default/Some Thinking):** Many common requests benefit from a degree of step-by-step processing or deeper understanding. Gemini can flexibly use thinking capability for tasks like:
  - Analogize photosynthesis and growing up.
  - Compare and contrast electric cars and hybrid cars.
- **Hard Tasks (Maximum Thinking Capability):** For truly complex challenges, such as solving complex math problems or coding tasks, we recommend setting a high thinking budget. These types of tasks require the model to engage its full reasoning and planning capabilities, often involving many internal steps before providing an answer. Examples include:
  - Solve problem 1 in AIME 2025: Find the sum of all integer bases b \> 9 for which 17~b~ is a divisor of 97~b~.
  - Write Python code for a web application that visualizes real-time stock market data, including user authentication. Make it as efficient as possible.

## Supported models, tools, and capabilities

Thinking features are supported on all 3 and 2.5 series models.
You can find all model capabilities on the
[model overview](https://ai.google.dev/gemini-api/docs/models) page.

Thinking models work with all of Gemini's tools and capabilities. This allows
the models to interact with external systems, execute code, or access real-time
information, incorporating the results into their reasoning and final response.

You can try examples of using tools with thinking models in the
[Thinking cookbook](https://colab.sandbox.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_thinking.ipynb).

## What's next?

- Thinking coverage is available in our [OpenAI Compatibility](https://ai.google.dev/gemini-api/docs/openai#thinking) guide.

# Thought Signatures

> [!IMPORTANT]
> **Important:** **Thought signatures are handled automatically** when you use the official [Google Gen AI SDKs](https://ai.google.dev/gemini-api/docs/libraries) and append the full model response object directly to history. **You
> only need to work with thought signatures directly when using the REST API** , or if you are *manually extracting and returning parts history in multi-turn
> conversations*.

Thought signatures are encrypted representations of the model's internal thought
process and are used to preserve reasoning context across multi-step
interactions.
When using thinking models (such as the Gemini 3 and 2.5 series), the API may
return a `thoughtSignature` field within the [content parts](https://ai.google.dev/api/caching#Part)
of the response (e.g., `text` or `functionCall` parts).

As a general rule, if you receive a thought signature in a model response,
you should pass it back exactly as received when sending the conversation
history in the next turn.
**When using Gemini 3 models, you must pass back thought signatures during
function calling, otherwise you will get a validation error** (4xx status code).
This includes when using the `minimal`
[thinking level](https://ai.google.dev/gemini-api/docs/thinking#thinking-levels) setting for Gemini 3
Flash.

## How it works

The graphic below visualizes the meaning of "turn" and "step" as they pertain to
[function calling](https://ai.google.dev/gemini-api/docs/function-calling) in the Gemini API. A "turn"
is a single, complete exchange in a conversation between a user and a model. A
"step" is a finer-grained action or operation performed by the model, often as
part of a larger process to complete a turn.

![Function calling turns and steps diagram](https://ai.google.dev/static/gemini-api/docs/images/fc-turns.png)

*This document focuses on handling function calling for Gemini 3 models. Refer
to the [model behavior](https://ai.google.dev/gemini-api/docs/thought-signatures#model-behavior) section for discrepancies with 2.5.*

Gemini 3 returns thought signatures for all model responses (responses from
the API) with a function call. Thought signatures show up in the following
cases:

- When there are [parallel function](https://ai.google.dev/gemini-api/docs/function-calling#parallel_function_calling) calls, the first function call part returned by the model response will have a thought signature.
- When there are sequential function calls (multi-step), each function call will have a signature and you must pass all signatures back.
- Model responses without a function call will return a thought signature inside the last part returned by the model.

The following table provides a visualization for multi-step function calls,
combining the definitions of turns and steps with the concept of signatures
introduced above:

|---|---|---|---|---|
| **Turn** | **Step** | **User Request** | **Model Response** | **FunctionResponse** |
| 1 | 1 | `request1 = user_prompt` | `FC1 + signature` | `FR1` |
| 1 | 2 | `request2 = request1 + (FC1 + signature) + FR1` | `FC2 + signature` | `FR2` |
| 1 | 3 | `request3 = request2 + (FC2 + signature) + FR2` | `text_output <br /> ` `(no FCs)` | None |

## Signatures in function calling parts

When Gemini generates a `functionCall`, it relies on the `thought_signature`
to process the tool's output correctly in the next turn.

- **Behavior** :
  - **Single Function Call** : The `functionCall` part will contain a `thought_signature`.
  - **Parallel Function Calls** : If the model generates parallel function calls in a response, the `thought_signature` is attached **only to the first** `functionCall` part. Subsequent `functionCall` parts in the same response will **not** contain a signature.
- **Requirement** : You **must** return this signature in the exact part where it was received when sending the conversation history back.
- **Validation** : Strict validation is enforced for all function calls within the current turn . (Only current turn is required; we don't validate on previous turns)
  - The API goes back in the history (newest to oldest) to find the most recent **User** message that contains standard content (e.g., `text`) ( which would be the start of the current turn). This will not **be** a `functionResponse`.
  - **All** model `functionCall` turns occurring after that specific use message are considered part of the turn.
  - The **first** `functionCall` part in **each step** of the current turn **must** include its `thought_signature`.
  - If you omit a `thought_signature` for the first `functionCall` part in any step of the current turn, the request will fail with a 400 error.
- **If proper signatures are not returned, here is how you will error out**
  - Gemini 3 models: Failure to include signatures will result in a 400 error. The verbiage will be of the form:
    - Function call `<Function Call>` in the `<index of contents array>` content block is missing a `thought_signature`. For example, *Function
      call `FC1` in the `1.` content block is missing a `thought_signature`.*

### Sequential function calling example

This section shows an example of multiple function calls where the user asks a
complex question requiring multiple tasks.

Let's walk through a multiple-turn function calling example where the user asks
a complex question requiring multiple tasks: `"Check flight status for AA100 and
book a taxi if delayed"`.

|---|---|---|---|---|
| **Turn** | **Step** | **User Request** | **Model Response** | **FunctionResponse** |
| 1 | 1 | `request1="Check flight status for AA100 and book a taxi 2 hours before if delayed."` | `FC1 ("check_flight") + signature` | `FR1` |
| 1 | 2 | `request2 = request1 + FC1 ("check_flight") + signature + FR1` | `FC2("book_taxi") + signature` | `FR2` |
| 1 | 3 | `request3 = request2 + FC2 ("book_taxi") + signature + FR2` | `text_output <br /> ` `(no FCs)` | `None` |

The following code illustrates the sequence in the above table.

**Turn 1, Step 1 (User request)**

    {
      "contents": [
        {
          "role": "user",
          "parts": [
            {
              "text": "Check flight status for AA100 and book a taxi 2 hours before if delayed."
            }
          ]
        }
      ],
      "tools": [
        {
          "functionDeclarations": [
            {
              "name": "check_flight",
              "description": "Gets the current status of a flight",
              "parameters": {
                "type": "object",
                "properties": {
                  "flight": {
                    "type": "string",
                    "description": "The flight number to check"
                  }
                },
                "required": [
                  "flight"
                ]
              }
            },
            {
              "name": "book_taxi",
              "description": "Book a taxi",
              "parameters": {
                "type": "object",
                "properties": {
                  "time": {
                    "type": "string",
                    "description": "time to book the taxi"
                  }
                },
                "required": [
                  "time"
                ]
              }
            }
          ]
        }
      ]
    }

**Turn 1, Step 1 (Model response)**

    {
    "content": {
            "role": "model",
            "parts": [
              {
                "functionCall": {
                  "name": "check_flight",
                  "args": {
                    "flight": "AA100"
                  }
                },
                "thoughtSignature": "<Signature A>"
              }
            ]
      }
    }

**Turn 1, Step 2 (User response - Sending tool outputs)** Since this user turn
only contains a `functionResponse` (no fresh text), we are still in Turn 1. We
must preserve `<Signature_A>`.

    {
          "role": "user",
          "parts": [
            {
              "text": "Check flight status for AA100 and book a taxi 2 hours before if delayed."
            }
          ]
        },
        {
            "role": "model",
            "parts": [
              {
                "functionCall": {
                  "name": "check_flight",
                  "args": {
                    "flight": "AA100"
                  }
                },
                "thoughtSignature": "<Signature A>" //Required and Validated
              }
            ]
          },
          {
            "role": "user",
            "parts": [
              {
                "functionResponse": {
                  "name": "check_flight",
                  "response": {
                    "status": "delayed",
                    "departure_time": "12 PM"
                    }
                  }
                }
            ]
    }

**Turn 1, Step 2 (Model)** The model now decides to book a taxi based on the
previous tool output.

    {
          "content": {
            "role": "model",
            "parts": [
              {
                "functionCall": {
                  "name": "book_taxi",
                  "args": {
                    "time": "10 AM"
                  }
                },
                "thoughtSignature": "<Signature B>"
              }
            ]
          }
    }

**Turn 1, Step 3 (User - Sending tool output)** To send the taxi booking
confirmation, we must include signatures for **ALL** function calls in this loop
(`<Signature A>` + `<Signature B>`).

    {
          "role": "user",
          "parts": [
            {
              "text": "Check flight status for AA100 and book a taxi 2 hours before if delayed."
            }
          ]
        },
        {
            "role": "model",
            "parts": [
              {
                "functionCall": {
                  "name": "check_flight",
                  "args": {
                    "flight": "AA100"
                  }
                },
                "thoughtSignature": "<Signature A>" //Required and Validated
              }
            ]
          },
          {
            "role": "user",
            "parts": [
              {
                "functionResponse": {
                  "name": "check_flight",
                  "response": {
                    "status": "delayed",
                    "departure_time": "12 PM"
                  }
                  }
                }
            ]
          },
          {
            "role": "model",
            "parts": [
              {
                "functionCall": {
                  "name": "book_taxi",
                  "args": {
                    "time": "10 AM"
                  }
                },
                "thoughtSignature": "<Signature B>" //Required and Validated
              }
            ]
          },
          {
            "role": "user",
            "parts": [
              {
                "functionResponse": {
                  "name": "book_taxi",
                  "response": {
                    "booking_status": "success"
                  }
                  }
                }
            ]
        }
    }

### Parallel function calling example

Let's walk through a parallel function calling example where the users asks
`"Check weather in Paris and London"` to see where the model does validation.

| **Turn** | **Step** | **User Request** | **Model Response** | **FunctionResponse** |
|---|---|---|---|---|
| 1 | 1 | request1="Check the weather in Paris and London" | FC1 ("Paris") + signature FC2 ("London") | FR1 |
| 1 | 2 | request 2 **=** request1 **+** FC1 ("Paris") + signature + FC2 ("London") | text_output (no FCs) | None |

The following code illustrates the sequence in the above table.

**Turn 1, Step 1 (User request)**

    {
      "contents": [
        {
          "role": "user",
          "parts": [
            {
              "text": "Check the weather in Paris and London."
            }
          ]
        }
      ],
      "tools": [
        {
          "functionDeclarations": [
            {
              "name": "get_current_temperature",
              "description": "Gets the current temperature for a given location.",
              "parameters": {
                "type": "object",
                "properties": {
                  "location": {
                    "type": "string",
                    "description": "The city name, e.g. San Francisco"
                  }
                },
                "required": [
                  "location"
                ]
              }
            }
          ]
        }
      ]
    }

**Turn 1, Step 1 (Model response)**

    {
      "content": {
        "parts": [
          {
            "functionCall": {
              "name": "get_current_temperature",
              "args": {
                "location": "Paris"
              }
            },
            "thoughtSignature": "<Signature_A>"// INCLUDED on First FC
          },
          {
            "functionCall": {
              "name": "get_current_temperature",
              "args": {
                "location": "London"
              }// NO signature on subsequent parallel FCs
            }
          }
        ]
      }
    }

**Turn 1, Step 2 (User response - Sending tool outputs)** We must preserve
`<Signature_A>` on the first part exactly as received.

    [
      {
        "role": "user",
        "parts": [
          {
            "text": "Check the weather in Paris and London."
          }
        ]
      },
      {
        "role": "model",
        "parts": [
          {
            "functionCall": {
              "name": "get_current_temperature",
              "args": {
                "city": "Paris"
              }
            },
            "thought_signature": "<Signature_A>" // MUST BE INCLUDED
          },
          {
            "functionCall": {
              "name": "get_current_temperature",
              "args": {
                "city": "London"
              }
            }
          } // NO SIGNATURE FIELD
        ]
      },
      {
        "role": "user",
        "parts": [
          {
            "functionResponse": {
              "name": "get_current_temperature",
              "response": {
                "temp": "15C"
              }
            }
          },
          {
            "functionResponse": {
              "name": "get_current_temperature",
              "response": {
                "temp": "12C"
              }
            }
          }
        ]
      }
    ]

## Signatures in non `functionCall` parts

Gemini may also return `thought_signatures` in the final part of the response
in non-function-call parts.

- **Behavior** : The final content part (`text, inlineData...`) returned by the model may contain a `thought_signature`.
- **Recommendation** : Returning these signatures is **recommended** to ensure the model maintains high-quality reasoning, especially for complex instruction following or simulated agentic workflows.
- **Validation** : The API does **not** strictly enforce validation. You won't receive a blocking error if you omit them, though performance may degrade.

### Text/In-context reasoning (No validation)

**Turn 1, Step 1 (Model response)**

    {
      "role": "model",
      "parts": [
        {
          "text": "I need to calculate the risk. Let me think step-by-step...",
          "thought_signature": "<Signature_C>" // OPTIONAL (Recommended)
        }
      ]
    }

**Turn 2, Step 1 (User)**

    [
      { "role": "user", "parts": [{ "text": "What is the risk?" }] },
      {
        "role": "model", 
        "parts": [
          {
            "text": "I need to calculate the risk. Let me think step-by-step...",
            // If you omit <Signature_C> here, no error will occur.
          }
        ]
      },
      { "role": "user", "parts": [{ "text": "Summarize it." }] }
    ]

## Signatures for OpenAI compatibility

The following examples shows how to handle thought signatures for a chat
completion API using [OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai).

### Sequential function calling example

This is an example of multiple function calling where the user asks a complex
question requiring multiple tasks.

Let's walk through a multiple-turn function calling example where the user asks
`Check flight status for AA100 and book a taxi if delayed` and you can see what
happens when the user asks a complex question requiring multiple tasks.

|---|---|---|---|---|
| **Turn** | **Step** | **User Request** | **Model Response** | **FunctionResponse** |
| 1 | 1 | `request1="Check the weather in Paris and London"` | `FC1 ("Paris") + signature <br /> ` `FC2 ("London")` | `FR1` |
| 1 | 2 | `request 2 = request1 + FC1 ("Paris") + signature + FC2 ("London")` | `text_output <br /> ` `(no FCs)` | `None` |

The following code walks through the given sequence.

**Turn 1, Step 1 (User Request)**

    {
      "model": "google/gemini-3.1-pro-preview",
      "messages": [
        {
          "role": "user",
          "content": "Check flight status for AA100 and book a taxi 2 hours before if delayed."
        }
      ],
      "tools": [
        {
          "type": "function",
          "function": {
            "name": "check_flight",
            "description": "Gets the current status of a flight",
            "parameters": {
              "type": "object",
              "properties": {
                "flight": {
                  "type": "string",
                  "description": "The flight number to check."
                }
              },
              "required": [
                "flight"
              ]
            }
          }
        },
        {
          "type": "function",
          "function": {
            "name": "book_taxi",
            "description": "Book a taxi",
            "parameters": {
              "type": "object",
              "properties": {
                "time": {
                  "type": "string",
                  "description": "time to book the taxi"
                }
              },
              "required": [
                "time"
              ]
            }
          }
        }
      ]
    }

**Turn 1, Step 1 (Model Response)**

    {
          "role": "model",
            "tool_calls": [
              {
                "extra_content": {
                  "google": {
                    "thought_signature": "<Signature A>"
                  }
                },
                "function": {
                  "arguments": "{\"flight\":\"AA100\"}",
                  "name": "check_flight"
                },
                "id": "function-call-1",
                "type": "function"
              }
            ]
        }

**Turn 1, Step 2 (User Response - Sending Tool Outputs)**

Since this user turn only contains a `functionResponse` (no fresh text), we are
still in Turn 1 and must preserve `<Signature_A>`.

    "messages": [
        {
          "role": "user",
          "content": "Check flight status for AA100 and book a taxi 2 hours before if delayed."
        },
        {
          "role": "model",
            "tool_calls": [
              {
                "extra_content": {
                  "google": {
                    "thought_signature": "<Signature A>" //Required and Validated
                  }
                },
                "function": {
                  "arguments": "{\"flight\":\"AA100\"}",
                  "name": "check_flight"
                },
                "id": "function-call-1",
                "type": "function"
              }
            ]
        },
        {
          "role": "tool",
          "name": "check_flight",
          "tool_call_id": "function-call-1",
          "content": "{\"status\":\"delayed\",\"departure_time\":\"12 PM\"}"                 
        }
      ]

**Turn 1, Step 2 (Model)**

The model now decides to book a taxi based on the previous tool output.

    {
    "role": "model",
    "tool_calls": [
    {
    "extra_content": {
    "google": {
    "thought_signature": "<Signature B>"
    }
                },
                "function": {
                  "arguments": "{\"time\":\"10 AM\"}",
                  "name": "book_taxi"
                },
                "id": "function-call-2",
                "type": "function"
              }
           ]
    }

**Turn 1, Step 3 (User - Sending Tool Output)**

To send the taxi booking confirmation, we must include signatures for ALL
function calls in this loop (`<Signature A>` + `<Signature B>`).

    "messages": [
        {
          "role": "user",
          "content": "Check flight status for AA100 and book a taxi 2 hours before if delayed."
        },
        {
          "role": "model",
            "tool_calls": [
              {
                "extra_content": {
                  "google": {
                    "thought_signature": "<Signature A>" //Required and Validated
                  }
                },
                "function": {
                  "arguments": "{\"flight\":\"AA100\"}",
                  "name": "check_flight"
                },
                "id": "function-call-1d6a1a61-6f4f-4029-80ce-61586bd86da5",
                "type": "function"
              }
            ]
        },
        {
          "role": "tool",
          "name": "check_flight",
          "tool_call_id": "function-call-1d6a1a61-6f4f-4029-80ce-61586bd86da5",
          "content": "{\"status\":\"delayed\",\"departure_time\":\"12 PM\"}"                 
        },
        {
          "role": "model",
            "tool_calls": [
              {
                "extra_content": {
                  "google": {
                    "thought_signature": "<Signature B>" //Required and Validated
                  }
                },
                "function": {
                  "arguments": "{\"time\":\"10 AM\"}",
                  "name": "book_taxi"
                },
                "id": "function-call-65b325ba-9b40-4003-9535-8c7137b35634",
                "type": "function"
              }
            ]
        },
        {
          "role": "tool",
          "name": "book_taxi",
          "tool_call_id": "function-call-65b325ba-9b40-4003-9535-8c7137b35634",
          "content": "{\"booking_status\":\"success\"}"
        }
      ]

### Parallel function calling example

Let's walk through a parallel function calling example where the users asks
`"Check weather in Paris and London"` and you can see where the model does
validation.

|---|---|---|---|---|
| **Turn** | **Step** | **User Request** | **Model Response** | **FunctionResponse** |
| 1 | 1 | `request1="Check the weather in Paris and London"` | `FC1 ("Paris") + signature <br /> ` `FC2 ("London")` | `FR1` |
| 1 | 2 | `request 2 = request1 + FC1 ("Paris") + signature + FC2 ("London")` | `text_output <br /> ` `(no FCs)` | `None` |

Here's the code to walk through the given sequence.

**Turn 1, Step 1 (User Request)**

    {
      "contents": [
        {
          "role": "user",
          "parts": [
            {
              "text": "Check the weather in Paris and London."
            }
          ]
        }
      ],
      "tools": [
        {
          "functionDeclarations": [
            {
              "name": "get_current_temperature",
              "description": "Gets the current temperature for a given location.",
              "parameters": {
                "type": "object",
                "properties": {
                  "location": {
                    "type": "string",
                    "description": "The city name, e.g. San Francisco"
                  }
                },
                "required": [
                  "location"
                ]
              }
            }
          ]
        }
      ]
    }

**Turn 1, Step 1 (Model Response)**

    {
    "role": "assistant",
            "tool_calls": [
              {
                "extra_content": {
                  "google": {
                    "thought_signature": "<Signature A>" //Signature returned
                  }
                },
                "function": {
                  "arguments": "{\"location\":\"Paris\"}",
                  "name": "get_current_temperature"
                },
                "id": "function-call-f3b9ecb3-d55f-4076-98c8-b13e9d1c0e01",
                "type": "function"
              },
              {
                "function": {
                  "arguments": "{\"location\":\"London\"}",
                  "name": "get_current_temperature"
                },
                "id": "function-call-335673ad-913e-42d1-bbf5-387c8ab80f44",
                "type": "function" // No signature on Parallel FC
              }
            ]
    }

**Turn 1, Step 2 (User Response - Sending Tool Outputs)**

You must preserve `<Signature_A>` on the first part exactly as received.

    "messages": [
        {
          "role": "user",
          "content": "Check the weather in Paris and London."
        },
        {
          "role": "assistant",
            "tool_calls": [
              {
                "extra_content": {
                  "google": {
                    "thought_signature": "<Signature A>" //Required
                  }
                },
                "function": {
                  "arguments": "{\"location\":\"Paris\"}",
                  "name": "get_current_temperature"
                },
                "id": "function-call-f3b9ecb3-d55f-4076-98c8-b13e9d1c0e01",
                "type": "function"
              },
              {
                "function": { //No Signature
                  "arguments": "{\"location\":\"London\"}",
                  "name": "get_current_temperature"
                },
                "id": "function-call-335673ad-913e-42d1-bbf5-387c8ab80f44",
                "type": "function"
              }
            ]
        },
        {
          "role":"tool",
          "name": "get_current_temperature",
          "tool_call_id": "function-call-f3b9ecb3-d55f-4076-98c8-b13e9d1c0e01",
          "content": "{\"temp\":\"15C\"}"
        },    
        {
          "role":"tool",
          "name": "get_current_temperature",
          "tool_call_id": "function-call-335673ad-913e-42d1-bbf5-387c8ab80f44",
          "content": "{\"temp\":\"12C\"}"
        }
      ]

## FAQs

1. **How do I transfer history from a different model to Gemini 3 with a
   function call part in the current turn and step? I need to provide function call
   parts that were not generated by the API and therefore don't have an associated
   thought signature?**

   While injecting custom function call blocks into the request is strongly
   discouraged, in cases where it can't be avoided, e.g. providing information
   to the model on function calls and responses that were executed
   deterministically by the client, or transferring a trace from a different
   model that does not include thought signatures, you can set the following
   dummy signatures of either `"context_engineering_is_the_way_to_go"` or
   `"skip_thought_signature_validator"` in the thought signature field to skip
   validation.
2. **I am sending back interleaved parallel function calls and responses and the
   API is returning a 400. Why?**

   When the API returns parallel function calls "FC1 + signature, FC2", the
   user response expected is "FC1+ signature, FC2, FR1, FR2". If you have them
   interleaved as "FC1 + signature, FR1, FC2, FR2" the API will return a 400
   error.
3. **When streaming and the model is not returning a function call I can't find
   the thought signature**

   During a model response not containing a FC with a streaming request, the
   model may return the thought signature in a part with an empty text content
   part. It is advisable to parse the entire request until the `finish_reason`
   is returned by the model.

## Thought signatures for different models

[Gemini 3 models](https://ai.google.dev/gemini-api/docs/models#gemini-3) and Gemini 2.5 models
behave differently with thought signatures in function calls:

- If there are function calls in a response,
  - Gemini 3 will always have the signature on the first function call part. It is **mandatory** to return that part.
  - Gemini 2.5 will have the signature in the first part (regardless of type). It is **optional** to return that part.
- If there are no function calls in a response,
  - Gemini 3 will have the signature on the last part if the model generates a thought.
  - Gemini 2.5 won't have a signature in any part.

Refer to the [Thinking](https://ai.google.dev/gemini-api/docs/thinking#signatures) page for more
comparison details.
For Gemini 3 Image models see the thinking process section of the
[Image generation](https://ai.google.dev/gemini-api/docs/image-generation#thinking-process) guide.

# Structured outputs

You can configure Gemini models to generate responses that adhere to a provided JSON
Schema. This ensures predictable, type-safe results and simplifies extracting
structured data from unstructured text.

Using structured outputs is ideal for:

- **Data extraction:** Pull specific information like names and dates from text.
- **Structured classification:** Classify text into predefined categories.
- **Agentic workflows:** Generate structured inputs for tools or APIs.

In addition to supporting JSON Schema in the REST API, the Google GenAI SDKs
make it easy to define schemas using
[Pydantic](https://docs.pydantic.dev/latest/) (Python) and
[Zod](https://zod.dev/) (JavaScript).

<button value="recipe" default="">Recipe Extractor</button> <button value="feedback">Content Moderation</button> <button value="recursive">Recursive Structures</button>

This example demonstrates how to extract structured data from text using basic
JSON Schema types like `object`, `array`, `string`, and `integer`.

### Python

    from google import genai
    from pydantic import BaseModel, Field
    from typing import List, Optional

    class Ingredient(BaseModel):
        name: str = Field(description="Name of the ingredient.")
        quantity: str = Field(description="Quantity of the ingredient, including units.")

    class Recipe(BaseModel):
        recipe_name: str = Field(description="The name of the recipe.")
        prep_time_minutes: Optional[int] = Field(description="Optional time in minutes to prepare the recipe.")
        ingredients: List[Ingredient]
        instructions: List[str]

    client = genai.Client()

    prompt = """
    Please extract the recipe from the following text.
    The user wants to make delicious chocolate chip cookies.
    They need 2 and 1/4 cups of all-purpose flour, 1 teaspoon of baking soda,
    1 teaspoon of salt, 1 cup of unsalted butter (softened), 3/4 cup of granulated sugar,
    3/4 cup of packed brown sugar, 1 teaspoon of vanilla extract, and 2 large eggs.
    For the best part, they'll need 2 cups of semisweet chocolate chips.
    First, preheat the oven to 375°F (190°C). Then, in a small bowl, whisk together the flour,
    baking soda, and salt. In a large bowl, cream together the butter, granulated sugar, and brown sugar
    until light and fluffy. Beat in the vanilla and eggs, one at a time. Gradually beat in the dry
    ingredients until just combined. Finally, stir in the chocolate chips. Drop by rounded tablespoons
    onto ungreased baking sheets and bake for 9 to 11 minutes.
    """

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": Recipe.model_json_schema(),
        },
    )

    recipe = Recipe.model_validate_json(response.text)
    print(recipe)

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import { z } from "zod";
    import { zodToJsonSchema } from "zod-to-json-schema";

    const ingredientSchema = z.object({
      name: z.string().describe("Name of the ingredient."),
      quantity: z.string().describe("Quantity of the ingredient, including units."),
    });

    const recipeSchema = z.object({
      recipe_name: z.string().describe("The name of the recipe."),
      prep_time_minutes: z.number().optional().describe("Optional time in minutes to prepare the recipe."),
      ingredients: z.array(ingredientSchema),
      instructions: z.array(z.string()),
    });

    const ai = new GoogleGenAI({});

    const prompt = `
    Please extract the recipe from the following text.
    The user wants to make delicious chocolate chip cookies.
    They need 2 and 1/4 cups of all-purpose flour, 1 teaspoon of baking soda,
    1 teaspoon of salt, 1 cup of unsalted butter (softened), 3/4 cup of granulated sugar,
    3/4 cup of packed brown sugar, 1 teaspoon of vanilla extract, and 2 large eggs.
    For the best part, they'll need 2 cups of semisweet chocolate chips.
    First, preheat the oven to 375°F (190°C). Then, in a small bowl, whisk together the flour,
    baking soda, and salt. In a large bowl, cream together the butter, granulated sugar, and brown sugar
    until light and fluffy. Beat in the vanilla and eggs, one at a time. Gradually beat in the dry
    ingredients until just combined. Finally, stir in the chocolate chips. Drop by rounded tablespoons
    onto ungreased baking sheets and bake for 9 to 11 minutes.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(recipeSchema),
      },
    });

    const recipe = recipeSchema.parse(JSON.parse(response.text));
    console.log(recipe);

### Go

    package main

    import (
        "context"
        "fmt"
        "log"

        "google.golang.org/genai"
    )

    func main() {
        ctx := context.Background()
        client, err := genai.NewClient(ctx, nil)
        if err != nil {
            log.Fatal(err)
        }

        prompt := `
      Please extract the recipe from the following text.
      The user wants to make delicious chocolate chip cookies.
      They need 2 and 1/4 cups of all-purpose flour, 1 teaspoon of baking soda,
      1 teaspoon of salt, 1 cup of unsalted butter (softened), 3/4 cup of granulated sugar,
      3/4 cup of packed brown sugar, 1 teaspoon of vanilla extract, and 2 large eggs.
      For the best part, they'll need 2 cups of semisweet chocolate chips.
      First, preheat the oven to 375°F (190°C). Then, in a small bowl, whisk together the flour,
      baking soda, and salt. In a large bowl, cream together the butter, granulated sugar, and brown sugar
      until light and fluffy. Beat in the vanilla and eggs, one at a time. Gradually beat in the dry
      ingredients until just combined. Finally, stir in the chocolate chips. Drop by rounded tablespoons
      onto ungreased baking sheets and bake for 9 to 11 minutes.
      `
        config := &genai.GenerateContentConfig{
            ResponseMIMEType: "application/json",
            ResponseJsonSchema: map[string]any{
                "type": "object",
                "properties": map[string]any{
                    "recipe_name": map[string]any{
                        "type":        "string",
                        "description": "The name of the recipe.",
                    },
                    "prep_time_minutes": map[string]any{
                        "type":        "integer",
                        "description": "Optional time in minutes to prepare the recipe.",
                    },
                    "ingredients": map[string]any{
                        "type": "array",
                        "items": map[string]any{
                            "type": "object",
                            "properties": map[string]any{
                                "name": map[string]any{
                                    "type":        "string",
                                    "description": "Name of the ingredient.",
                                },
                                "quantity": map[string]any{
                                    "type":        "string",
                                    "description": "Quantity of the ingredient, including units.",
                                },
                            },
                            "required": []string{"name", "quantity"},
                        },
                    },
                    "instructions": map[string]any{
                        "type":  "array",
                        "items": map[string]any{"type": "string"},
                    },
                },
                "required": []string{"recipe_name", "ingredients", "instructions"},
            },
        }

        result, err := client.Models.GenerateContent(
            ctx,
            "gemini-3-flash-preview",
            genai.Text(prompt),
            config,
        )
        if err != nil {
            log.Fatal(err)
        }
        fmt.Println(result.Text())
    }

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -X POST \
        -d '{
          "contents": [{
            "parts":[
              { "text": "Please extract the recipe from the following text.\nThe user wants to make delicious chocolate chip cookies.\nThey need 2 and 1/4 cups of all-purpose flour, 1 teaspoon of baking soda,\n1 teaspoon of salt, 1 cup of unsalted butter (softened), 3/4 cup of granulated sugar,\n3/4 cup of packed brown sugar, 1 teaspoon of vanilla extract, and 2 large eggs.\nFor the best part, they will need 2 cups of semisweet chocolate chips.\nFirst, preheat the oven to 375°F (190°C). Then, in a small bowl, whisk together the flour,\nbaking soda, and salt. In a large bowl, cream together the butter, granulated sugar, and brown sugar\nuntil light and fluffy. Beat in the vanilla and eggs, one at a time. Gradually beat in the dry\ningredients until just combined. Finally, stir in the chocolate chips. Drop by rounded tablespoons\nonto ungreased baking sheets and bake for 9 to 11 minutes." }
            ]
          }],
          "generationConfig": {
            "responseMimeType": "application/json",
            "responseJsonSchema": {
              "type": "object",
              "properties": {
                "recipe_name": {
                  "type": "string",
                  "description": "The name of the recipe."
                },
                "prep_time_minutes": {
                    "type": "integer",
                    "description": "Optional time in minutes to prepare the recipe."
                },
                "ingredients": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string", "description": "Name of the ingredient."},
                      "quantity": { "type": "string", "description": "Quantity of the ingredient, including units."}
                    },
                    "required": ["name", "quantity"]
                  }
                },
                "instructions": {
                  "type": "array",
                  "items": { "type": "string" }
                }
              },
              "required": ["recipe_name", "ingredients", "instructions"]
            }
          }
        }'

**Example Response:**

    {
      "recipe_name": "Delicious Chocolate Chip Cookies",
      "ingredients": [
        {
          "name": "all-purpose flour",
          "quantity": "2 and 1/4 cups"
        },
        {
          "name": "baking soda",
          "quantity": "1 teaspoon"
        },
        {
          "name": "salt",
          "quantity": "1 teaspoon"
        },
        {
          "name": "unsalted butter (softened)",
          "quantity": "1 cup"
        },
        {
          "name": "granulated sugar",
          "quantity": "3/4 cup"
        },
        {
          "name": "packed brown sugar",
          "quantity": "3/4 cup"
        },
        {
          "name": "vanilla extract",
          "quantity": "1 teaspoon"
        },
        {
          "name": "large eggs",
          "quantity": "2"
        },
        {
          "name": "semisweet chocolate chips",
          "quantity": "2 cups"
        }
      ],
      "instructions": [
        "Preheat the oven to 375°F (190°C).",
        "In a small bowl, whisk together the flour, baking soda, and salt.",
        "In a large bowl, cream together the butter, granulated sugar, and brown sugar until light and fluffy.",
        "Beat in the vanilla and eggs, one at a time.",
        "Gradually beat in the dry ingredients until just combined.",
        "Stir in the chocolate chips.",
        "Drop by rounded tablespoons onto ungreased baking sheets and bake for 9 to 11 minutes."
      ]
    }

## Streaming

You can stream structured outputs, which allows you to start processing the
response as it's being generated, without having to wait for the entire output
to be complete. This can improve the perceived performance of your application.

The streamed chunks will be valid partial JSON strings, which can be
concatenated to form the final, complete JSON object.

### Python

    from google import genai
    from pydantic import BaseModel, Field
    from typing import Literal

    class Feedback(BaseModel):
        sentiment: Literal["positive", "neutral", "negative"]
        summary: str

    client = genai.Client()
    prompt = "The new UI is incredibly intuitive and visually appealing. Great job. Add a very long summary to test streaming!"

    response_stream = client.models.generate_content_stream(
        model="gemini-3-flash-preview",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": Feedback.model_json_schema(),
        },
    )

    for chunk in response_stream:
        print(chunk.candidates[0].content.parts[0].text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import { z } from "zod";
    import { zodToJsonSchema } from "zod-to-json-schema";

    const ai = new GoogleGenAI({});
    const prompt = "The new UI is incredibly intuitive and visually appealing. Great job! Add a very long summary to test streaming!";

    const feedbackSchema = z.object({
      sentiment: z.enum(["positive", "neutral", "negative"]),
      summary: z.string(),
    });

    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(feedbackSchema),
      },
    });

    for await (const chunk of stream) {
      console.log(chunk.candidates[0].content.parts[0].text)
    }

## Structured outputs with tools

> [!WARNING]
> **Preview:** This feature is available only to Gemini 3 series models, `gemini-3.1-pro-preview` and `gemini-3-flash-preview`.

Gemini 3 lets you combine Structured Outputs with built-in tools, including
[Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search),
[URL Context](https://ai.google.dev/gemini-api/docs/url-context),
[Code Execution](https://ai.google.dev/gemini-api/docs/code-execution),
[File Search](https://ai.google.dev/gemini-api/docs/file-search#structured-output), and
[Function Calling](https://ai.google.dev/gemini-api/docs/function-calling).

### Python

    from google import genai
    from pydantic import BaseModel, Field
    from typing import List

    class MatchResult(BaseModel):
        winner: str = Field(description="The name of the winner.")
        final_match_score: str = Field(description="The final match score.")
        scorers: List[str] = Field(description="The name of the scorer.")

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-3.1-pro-preview",
        contents="Search for all details for the latest Euro.",
        config={
            "tools": [
                {"google_search": {}},
                {"url_context": {}}
            ],
            "response_mime_type": "application/json",
            "response_json_schema": MatchResult.model_json_schema(),
        },  
    )

    result = MatchResult.model_validate_json(response.text)
    print(result)

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import { z } from "zod";
    import { zodToJsonSchema } from "zod-to-json-schema";

    const ai = new GoogleGenAI({});

    const matchSchema = z.object({
      winner: z.string().describe("The name of the winner."),
      final_match_score: z.string().describe("The final score."),
      scorers: z.array(z.string()).describe("The name of the scorer.")
    });

    async function run() {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: "Search for all details for the latest Euro.",
        config: {
          tools: [
            { googleSearch: {} },
            { urlContext: {} }
          ],
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(matchSchema),
        },
      });

      const match = matchSchema.parse(JSON.parse(response.text));
      console.log(match);
    }

    run();

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -X POST \
      -d '{
        "contents": [{
          "parts": [{"text": "Search for all details for the latest Euro."}]
        }],
        "tools": [
          {"googleSearch": {}},
          {"urlContext": {}}
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseJsonSchema": {
                "type": "object",
                "properties": {
                    "winner": {"type": "string", "description": "The name of the winner."},
                    "final_match_score": {"type": "string", "description": "The final score."},
                    "scorers": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "The name of the scorer."
                    }
                },
                "required": ["winner", "final_match_score", "scorers"]
            }
        }
      }'

## JSON schema support

To generate a JSON object, set the `response_mime_type` in the generation configuration to `application/json` and provide a `response_json_schema`. The schema must be a valid [JSON Schema](https://json-schema.org/) that describes the desired output format.

The model will then generate a response that is a syntactically valid JSON string matching the provided schema. When using structured outputs, the model will produce outputs in the same order as the keys in the schema.

Gemini's structured output mode supports a subset of the [JSON Schema](https://json-schema.org) specification.

The following values of `type` are supported:

- **`string`**: For text.
- **`number`**: For floating-point numbers.
- **`integer`**: For whole numbers.
- **`boolean`**: For true/false values.
- **`object`**: For structured data with key-value pairs.
- **`array`**: For lists of items.
- **`null`** : To allow a property to be null, include `"null"` in the type array (e.g., `{"type": ["string", "null"]}`).

These descriptive properties help guide the model:

- **`title`**: A short description of a property.
- **`description`**: A longer and more detailed description of a property.

### Type-specific properties

**For `object` values:**

- **`properties`**: An object where each key is a property name and each value is a schema for that property.
- **`required`**: An array of strings, listing which properties are mandatory.
- **`additionalProperties`** : Controls whether properties not listed in `properties` are allowed. Can be a boolean or a schema.

**For `string` values:**

- **`enum`**: Lists a specific set of possible strings for classification tasks.
- **`format`** : Specifies a syntax for the string, such as `date-time`, `date`, `time`.

**For `number` and `integer` values:**

- **`enum`**: Lists a specific set of possible numeric values.
- **`minimum`**: The minimum inclusive value.
- **`maximum`**: The maximum inclusive value.

**For `array` values:**

- **`items`**: Defines the schema for all items in the array.
- **`prefixItems`**: Defines a list of schemas for the first N items, allowing for tuple-like structures.
- **`minItems`**: The minimum number of items in the array.
- **`maxItems`**: The maximum number of items in the array.

## Model support

The following models support structured output:

| Model | Structured Outputs |
|---|---|
| Gemini 3.1 Pro Preview | ✔️ |
| Gemini 3 Flash Preview | ✔️ |
| Gemini 2.5 Pro | ✔️ |
| Gemini 2.5 Flash | ✔️ |
| Gemini 2.5 Flash-Lite | ✔️ |
| Gemini 2.0 Flash | ✔️\* |
| Gemini 2.0 Flash-Lite | ✔️\* |

*\* Note that Gemini 2.0 requires an explicit `propertyOrdering` list within the JSON input to define the preferred structure. You can find an example in this [cookbook](https://github.com/google-gemini/cookbook/blob/main/examples/Pdf_structured_outputs_on_invoices_and_forms.ipynb).*

## Structured outputs vs. function calling

Both structured outputs and function calling use JSON schemas, but they serve different purposes:

| Feature | Primary Use Case |
|---|---|
| **Structured Outputs** | **Formatting the final response to the user.** Use this when you want the model's *answer* to be in a specific format (e.g., extracting data from a document to save to a database). |
| **Function Calling** | **Taking action during the conversation.** Use this when the model needs to *ask you* to perform a task (e.g., "get current weather") before it can provide a final answer. |

## Best practices

- **Clear descriptions:** Use the `description` field in your schema to provide clear instructions to the model about what each property represents. This is crucial for guiding the model's output.
- **Strong typing:** Use specific types (`integer`, `string`, `enum`) whenever possible. If a parameter has a limited set of valid values, use an `enum`.
- **Prompt engineering:** Clearly state in your prompt what you want the model to do. For example, "Extract the following information from the text..." or "Classify this feedback according to the provided schema...".
- **Validation:** While structured output guarantees syntactically correct JSON, it does not guarantee the values are semantically correct. Always validate the final output in your application code before using it.
- **Error handling:** Implement robust error handling in your application to gracefully manage cases where the model's output, while schema-compliant, may not meet your business logic requirements.

## Limitations

- **Schema subset:** Not all features of the JSON Schema specification are supported. The model ignores unsupported properties.
- **Schema complexity:** The API may reject very large or deeply nested schemas. If you encounter errors, try simplifying your schema by shortening property names, reducing nesting, or limiting the number of constraints.

# Long context

Many Gemini models come with large context windows of 1 million or more tokens.
Historically, large language models (LLMs) were significantly limited by
the amount of text (or tokens) that could be passed to the model at one time.
The Gemini long context window unlocks many new use cases and developer
paradigms.

The code you already use for cases like [text
generation](https://ai.google.dev/gemini-api/docs/text-generation) or [multimodal
inputs](https://ai.google.dev/gemini-api/docs/vision) will work without any changes with long context.

This document gives you an overview of what you can achieve using models with
context windows of 1M and more tokens. The page gives a brief overview of
a context window, and explores how developers should think about long context,
various real world use cases for long context, and ways to optimize the usage
of long context.

For the context window sizes of specific models, see the
[Models](https://ai.google.dev/gemini-api/docs/models) page.

## What is a context window?

The basic way you use the Gemini models is by passing information (context)
to the model, which will subsequently generate a response. An analogy for the
context window is short term memory. There is a limited amount of information
that can be stored in someone's short term memory, and the same is true for
generative models.

You can read more about how models work under the hood in our [generative models
guide](https://ai.google.dev/gemini-api/docs/prompting-strategies#under-the-hood).

## Getting started with long context

Earlier versions of generative models were only able to process 8,000
tokens at a time. Newer models pushed this further by accepting 32,000 or even
128,000 tokens. Gemini is the first model capable of accepting 1 million tokens.

In practice, 1 million tokens would look like:

- 50,000 lines of code (with the standard 80 characters per line)
- All the text messages you have sent in the last 5 years
- 8 average length English novels
- Transcripts of over 200 average length podcast episodes

The more limited context windows common in many other models often require
strategies like arbitrarily dropping old messages, summarizing content, using
RAG with vector databases, or filtering prompts to save tokens.

While these techniques remain valuable in specific scenarios, Gemini's extensive
context window invites a more direct approach: providing all relevant
information upfront. Because Gemini models were purpose-built with massive
context capabilities, they demonstrate powerful in-context learning. For
example, using only in-context instructional materials (a 500-page reference
grammar, a dictionary, and ≈400 parallel sentences), Gemini
[learned to translate](https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf)
from English to Kalamang---a Papuan language with
fewer than 200 speakers---with quality similar to a human learner using the same
materials. This illustrates the paradigm shift enabled by Gemini's long context,
empowering new possibilities through robust in-context learning.

## Long context use cases

While the standard use case for most generative models is still text input, the
Gemini model family enables a new paradigm of multimodal use cases. These
models can natively understand text, video, audio, and images. They are
accompanied by the [Gemini API that takes in multimodal file
types](https://ai.google.dev/gemini-api/docs/prompting_with_media) for
convenience.

### Long form text

Text has proved to be the layer of intelligence underpinning much of the
momentum around LLMs. As mentioned earlier, much of the practical limitation of
LLMs was because of not having a large enough context window to do certain
tasks. This led to the rapid adoption of retrieval augmented generation (RAG)
and other techniques which dynamically provide the model with relevant
contextual information. Now, with larger and larger context windows, there are
new techniques becoming available which unlock new use cases.

Some emerging and standard use cases for text based long context include:

- Summarizing large corpuses of text
  - Previous summarization options with smaller context models would require a sliding window or another technique to keep state of previous sections as new tokens are passed to the model
- Question and answering
  - Historically this was only possible with RAG given the limited amount of context and models' factual recall being low
- Agentic workflows
  - Text is the underpinning of how agents keep state of what they have done and what they need to do; not having enough information about the world and the agent's goal is a limitation on the reliability of agents

[Many-shot in-context learning](https://arxiv.org/pdf/2404.11018) is one of the
most unique capabilities unlocked by long context models. Research has shown
that taking the common "single shot" or "multi-shot" example paradigm, where the
model is presented with one or a few examples of a task, and scaling that up to
hundreds, thousands, or even hundreds of thousands of examples, can lead to
novel model capabilities. This many-shot approach has also been shown to perform
similarly to models which were fine-tuned for a specific task. For use cases
where a Gemini model's performance is not yet sufficient for a production
rollout, you can try the many-shot approach. As you might explore later in the
long context optimization section, context caching makes this type of high input
token workload much more economically feasible and even lower latency in some
cases.

### Long form video

Video content's utility has long been constrained by the lack of accessibility
of the medium itself. It was hard to skim the content, transcripts often failed
to capture the nuance of a video, and most tools don't process image, text, and
audio together. With Gemini, the long-context text capabilities translate to
the ability to reason and answer questions about multimodal inputs with
sustained performance.

Some emerging and standard use cases for video long context include:

- Video question and answering
- Video memory, as shown with [Google's Project Astra](https://deepmind.google/technologies/gemini/project-astra/)
- Video captioning
- Video recommendation systems, by enriching existing metadata with new multimodal understanding
- Video customization, by looking at a corpus of data and associated video metadata and then removing parts of videos that are not relevant to the viewer
- Video content moderation
- Real-time video processing

When working with videos, it is important to consider how the [videos are
processed into tokens](https://ai.google.dev/gemini-api/docs/tokens#media-token), which affects
billing and usage limits. You can learn more about prompting with video files in
the [Prompting
guide](https://ai.google.dev/gemini-api/docs/prompting_with_media?lang=python#prompting-with-videos).

### Long form audio

The Gemini models were the first natively multimodal large language models
that could understand audio. Historically, the typical developer workflow would
involve stringing together multiple domain specific models, like a
speech-to-text model and a text-to-text model, in order to process audio. This
led to additional latency required by performing multiple round-trip requests
and decreased performance usually attributed to disconnected architectures of
the multiple model setup.

Some emerging and standard use cases for audio context include:

- Real-time transcription and translation
- Podcast / video question and answering
- Meeting transcription and summarization
- Voice assistants

You can learn more about prompting with audio files in the [Prompting
guide](https://ai.google.dev/gemini-api/docs/prompting_with_media?lang=python#prompting-with-videos).

## Long context optimizations

The primary optimization when working with long context and the Gemini
models is to use [context
caching](https://ai.google.dev/gemini-api/docs/caching). Beyond the previous
impossibility of processing lots of tokens in a single request, the other main
constraint was the cost. If you have a "chat with your data" app where a user
uploads 10 PDFs, a video, and some work documents, you would historically have
to work with a more complex retrieval augmented generation (RAG) tool /
framework in order to process these requests and pay a significant amount for
tokens moved into the context window. Now, you can cache the files the user
uploads and pay to store them on a per hour basis. The input / output cost per
request with Gemini Flash for example is \~4x less than the standard
input / output cost, so if
the user chats with their data enough, it becomes a huge cost saving for you as
the developer.

## Long context limitations

In various sections of this guide, we talked about how Gemini models achieve
high performance across various needle-in-a-haystack retrieval evals. These
tests consider the most basic setup, where you have a single needle you are
looking for. In cases where you might have multiple "needles" or specific pieces
of information you are looking for, the model does not perform with the same
accuracy. Performance can vary to a wide degree depending on the context. This
is important to consider as there is an inherent tradeoff between getting the
right information retrieved and cost. You can get \~99% on a single query, but
you have to pay the input token cost every time you send that query. So for 100
pieces of information to be retrieved, if you needed 99% performance, you would
likely need to send 100 requests. This is a good example of where context
caching can significantly reduce the cost associated with using Gemini models
while keeping the performance high.

## FAQs

### Where is the best place to put my query in the context window?

In most cases, especially if the total context is long, the model's
performance will be better if you put your query / question at the end of the
prompt (after all the other context).

### Do I lose model performance when I add more tokens to a query?

Generally, if you don't need tokens to be passed to the model, it is best to
avoid passing them. However, if you have a large chunk of tokens with some
information and want to ask questions about that information, the model is
highly capable of extracting that information (up to 99% accuracy in many
cases).

### How can I lower my cost with long-context queries?

If you have a similar set of tokens / context that you want to re-use many
times, [context caching](https://ai.google.dev/gemini-api/docs/caching) can help reduce the costs
associated with asking questions about that information.

### Does the context length affect the model latency?

There is some fixed amount of latency in any given request, regardless of the
size, but generally longer queries will have higher latency (time to first
token).

# Text generation

The Gemini API can generate text output from text, images, video, and audio
inputs.

Here's a basic example:

### Python

    from google import genai

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="How does AI work?"
    )
    print(response.text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "How does AI work?",
      });
      console.log(response.text);
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "os"
      "google.golang.org/genai"
    )

    func main() {

      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      result, _ := client.Models.GenerateContent(
          ctx,
          "gemini-3-flash-preview",
          genai.Text("Explain how AI works in a few words"),
          nil,
      )

      fmt.Println(result.Text())
    }

### Java

    import com.google.genai.Client;
    import com.google.genai.types.GenerateContentResponse;

    public class GenerateContentWithTextInput {
      public static void main(String[] args) {

        Client client = new Client();

        GenerateContentResponse response =
            client.models.generateContent("gemini-3-flash-preview", "How does AI work?", null);

        System.out.println(response.text());
      }
    }

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -X POST \
      -d '{
        "contents": [
          {
            "parts": [
              {
                "text": "How does AI work?"
              }
            ]
          }
        ]
      }'

### Apps Script

    // See https://developers.google.com/apps-script/guides/properties
    // for instructions on how to set the API key.
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    function main() {
      const payload = {
        contents: [
          {
            parts: [
              { text: 'How AI does work?' },
            ],
          },
        ],
      };

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
      const options = {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey,
        },
        payload: JSON.stringify(payload)
      };

      const response = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(response);
      const content = data['candidates'][0]['content']['parts'][0]['text'];
      console.log(content);
    }

## Thinking with Gemini

Gemini models often have ["thinking"](https://ai.google.dev/gemini-api/docs/thinking) enabled by default
which allows the model to reason before responding to a request.

Each model supports different thinking configurations which gives you control
over cost, latency, and intelligence. For more details, see the
[thinking guide](https://ai.google.dev/gemini-api/docs/thinking#set-budget).

### Python

    from google import genai
    from google.genai import types

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="How does AI work?",
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_level="low")
        ),
    )
    print(response.text)

### JavaScript

    import { GoogleGenAI, ThinkingLevel } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "How does AI work?",
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        }
      });
      console.log(response.text);
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "os"
      "google.golang.org/genai"
    )

    func main() {

      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      thinkingLevelVal := "low"

      result, _ := client.Models.GenerateContent(
          ctx,
          "gemini-3-flash-preview",
          genai.Text("How does AI work?"),
          &genai.GenerateContentConfig{
            ThinkingConfig: &genai.ThinkingConfig{
                ThinkingLevel: &thinkingLevelVal,
            },
          }
      )

      fmt.Println(result.Text())
    }

### Java

    import com.google.genai.Client;
    import com.google.genai.types.GenerateContentConfig;
    import com.google.genai.types.GenerateContentResponse;
    import com.google.genai.types.ThinkingConfig;
    import com.google.genai.types.ThinkingLevel;

    public class GenerateContentWithThinkingConfig {
      public static void main(String[] args) {

        Client client = new Client();

        GenerateContentConfig config =
            GenerateContentConfig.builder()
                .thinkingConfig(ThinkingConfig.builder().thinkingLevel(new ThinkingLevel("low")))
                .build();

        GenerateContentResponse response =
            client.models.generateContent("gemini-3-flash-preview", "How does AI work?", config);

        System.out.println(response.text());
      }
    }

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -X POST \
      -d '{
        "contents": [
          {
            "parts": [
              {
                "text": "How does AI work?"
              }
            ]
          }
        ],
        "generationConfig": {
          "thinkingConfig": {
            "thinkingLevel": "low"
          }
        }
      }'

### Apps Script

    // See https://developers.google.com/apps-script/guides/properties
    // for instructions on how to set the API key.
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    function main() {
      const payload = {
        contents: [
          {
            parts: [
              { text: 'How AI does work?' },
            ],
          },
        ],
        generationConfig: {
          thinkingConfig: {
            thinkingLevel: 'low'
          }
        }
      };

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
      const options = {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey,
        },
        payload: JSON.stringify(payload)
      };

      const response = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(response);
      const content = data['candidates'][0]['content']['parts'][0]['text'];
      console.log(content);
    }

## System instructions and other configurations

You can guide the behavior of Gemini models with system instructions. To do so,
pass a [`GenerateContentConfig`](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig)
object.

### Python

    from google import genai
    from google.genai import types

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        config=types.GenerateContentConfig(
            system_instruction="You are a cat. Your name is Neko."),
        contents="Hello there"
    )

    print(response.text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Hello there",
        config: {
          systemInstruction: "You are a cat. Your name is Neko.",
        },
      });
      console.log(response.text);
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "os"
      "google.golang.org/genai"
    )

    func main() {

      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      config := &genai.GenerateContentConfig{
          SystemInstruction: genai.NewContentFromText("You are a cat. Your name is Neko.", genai.RoleUser),
      }

      result, _ := client.Models.GenerateContent(
          ctx,
          "gemini-3-flash-preview",
          genai.Text("Hello there"),
          config,
      )

      fmt.Println(result.Text())
    }

### Java

    import com.google.genai.Client;
    import com.google.genai.types.Content;
    import com.google.genai.types.GenerateContentConfig;
    import com.google.genai.types.GenerateContentResponse;
    import com.google.genai.types.Part;

    public class GenerateContentWithSystemInstruction {
      public static void main(String[] args) {

        Client client = new Client();

        GenerateContentConfig config =
            GenerateContentConfig.builder()
                .systemInstruction(
                    Content.fromParts(Part.fromText("You are a cat. Your name is Neko.")))
                .build();

        GenerateContentResponse response =
            client.models.generateContent("gemini-3-flash-preview", "Hello there", config);

        System.out.println(response.text());
      }
    }

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -d '{
        "system_instruction": {
          "parts": [
            {
              "text": "You are a cat. Your name is Neko."
            }
          ]
        },
        "contents": [
          {
            "parts": [
              {
                "text": "Hello there"
              }
            ]
          }
        ]
      }'

### Apps Script

    // See https://developers.google.com/apps-script/guides/properties
    // for instructions on how to set the API key.
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    function main() {
      const systemInstruction = {
        parts: [{
          text: 'You are a cat. Your name is Neko.'
        }]
      };

      const payload = {
        systemInstruction,
        contents: [
          {
            parts: [
              { text: 'Hello there' },
            ],
          },
        ],
      };

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
      const options = {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey,
        },
        payload: JSON.stringify(payload)
      };

      const response = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(response);
      const content = data['candidates'][0]['content']['parts'][0]['text'];
      console.log(content);
    }

The [`GenerateContentConfig`](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig)
object also lets you override default generation parameters, such as
[temperature](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig).

> [!NOTE]
> When using Gemini 3 models, we strongly recommend keeping the `temperature` at its default value of 1.0. Changing the temperature (setting it below 1.0) may lead to unexpected behavior, such as looping or degraded performance, particularly in complex mathematical or reasoning tasks.

### Python

    from google import genai
    from google.genai import types

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=["Explain how AI works"],
        config=types.GenerateContentConfig(
            temperature=0.1
        )
    )
    print(response.text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Explain how AI works",
        config: {
          temperature: 0.1,
        },
      });
      console.log(response.text);
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "os"
      "google.golang.org/genai"
    )

    func main() {

      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      temp := float32(0.9)
      topP := float32(0.5)
      topK := float32(20.0)

      config := &genai.GenerateContentConfig{
        Temperature:       &temp,
        TopP:              &topP,
        TopK:              &topK,
        ResponseMIMEType:  "application/json",
      }

      result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-3-flash-preview",
        genai.Text("What is the average size of a swallow?"),
        config,
      )

      fmt.Println(result.Text())
    }

### Java

    import com.google.genai.Client;
    import com.google.genai.types.GenerateContentConfig;
    import com.google.genai.types.GenerateContentResponse;

    public class GenerateContentWithConfig {
      public static void main(String[] args) {

        Client client = new Client();

        GenerateContentConfig config = GenerateContentConfig.builder().temperature(0.1f).build();

        GenerateContentResponse response =
            client.models.generateContent("gemini-3-flash-preview", "Explain how AI works", config);

        System.out.println(response.text());
      }
    }

### REST

    curl https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -X POST \
      -d '{
        "contents": [
          {
            "parts": [
              {
                "text": "Explain how AI works"
              }
            ]
          }
        ],
        "generationConfig": {
          "stopSequences": [
            "Title"
          ],
          "temperature": 1.0,
          "topP": 0.8,
          "topK": 10
        }
      }'

### Apps Script

    // See https://developers.google.com/apps-script/guides/properties
    // for instructions on how to set the API key.
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    function main() {
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        responseMimeType: 'text/plain',
      };

      const payload = {
        generationConfig,
        contents: [
          {
            parts: [
              { text: 'Explain how AI works in a few words' },
            ],
          },
        ],
      };

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
      const options = {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey,
        },
        payload: JSON.stringify(payload)
      };

      const response = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(response);
      const content = data['candidates'][0]['content']['parts'][0]['text'];
      console.log(content);
    }

Refer to the [`GenerateContentConfig`](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig)
in our API reference for a complete list of configurable parameters and their
descriptions.

## Multimodal inputs

The Gemini API supports multimodal inputs, allowing you to combine text with
media files. The following example demonstrates providing an image:

### Python

    from PIL import Image
    from google import genai

    client = genai.Client()

    image = Image.open("/path/to/organ.png")
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[image, "Tell me about this instrument"]
    )
    print(response.text)

### JavaScript

    import {
      GoogleGenAI,
      createUserContent,
      createPartFromUri,
    } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const image = await ai.files.upload({
        file: "/path/to/organ.png",
      });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          createUserContent([
            "Tell me about this instrument",
            createPartFromUri(image.uri, image.mimeType),
          ]),
        ],
      });
      console.log(response.text);
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "os"
      "google.golang.org/genai"
    )

    func main() {

      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      imagePath := "/path/to/organ.jpg"
      imgData, _ := os.ReadFile(imagePath)

      parts := []*genai.Part{
          genai.NewPartFromText("Tell me about this instrument"),
          &genai.Part{
              InlineData: &genai.Blob{
                  MIMEType: "image/jpeg",
                  Data:     imgData,
              },
          },
      }

      contents := []*genai.Content{
          genai.NewContentFromParts(parts, genai.RoleUser),
      }

      result, _ := client.Models.GenerateContent(
          ctx,
          "gemini-3-flash-preview",
          contents,
          nil,
      )

      fmt.Println(result.Text())
    }

### Java

    import com.google.genai.Client;
    import com.google.genai.Content;
    import com.google.genai.types.GenerateContentResponse;
    import com.google.genai.types.Part;

    public class GenerateContentWithMultiModalInputs {
      public static void main(String[] args) {

        Client client = new Client();

        Content content =
          Content.fromParts(
              Part.fromText("Tell me about this instrument"),
              Part.fromUri("/path/to/organ.jpg", "image/jpeg"));

        GenerateContentResponse response =
            client.models.generateContent("gemini-3-flash-preview", content, null);

        System.out.println(response.text());
      }
    }

### REST

    # Use a temporary file to hold the base64 encoded image data
    TEMP_B64=$(mktemp)
    trap 'rm -f "$TEMP_B64"' EXIT
    base64 $B64FLAGS $IMG_PATH > "$TEMP_B64"

    # Use a temporary file to hold the JSON payload
    TEMP_JSON=$(mktemp)
    trap 'rm -f "$TEMP_JSON"' EXIT

    cat > "$TEMP_JSON" << EOF
    {
      "contents": [
        {
          "parts": [
            {
              "text": "Tell me about this instrument"
            },
            {
              "inline_data": {
                "mime_type": "image/jpeg",
                "data": "$(cat "$TEMP_B64")"
              }
            }
          ]
        }
      ]
    }
    EOF

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -X POST \
      -d "@$TEMP_JSON"

### Apps Script

    // See https://developers.google.com/apps-script/guides/properties
    // for instructions on how to set the API key.
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    function main() {
      const imageUrl = 'http://image/url';
      const image = getImageData(imageUrl);
      const payload = {
        contents: [
          {
            parts: [
              { image },
              { text: 'Tell me about this instrument' },
            ],
          },
        ],
      };

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
      const options = {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey,
        },
        payload: JSON.stringify(payload)
      };

      const response = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(response);
      const content = data['candidates'][0]['content']['parts'][0]['text'];
      console.log(content);
    }

    function getImageData(url) {
      const blob = UrlFetchApp.fetch(url).getBlob();

      return {
        mimeType: blob.getContentType(),
        data: Utilities.base64Encode(blob.getBytes())
      };
    }

For alternative methods of providing images and more advanced image processing,
see our [image understanding guide](https://ai.google.dev/gemini-api/docs/image-understanding).
The API also supports [document](https://ai.google.dev/gemini-api/docs/document-processing), [video](https://ai.google.dev/gemini-api/docs/video-understanding), and [audio](https://ai.google.dev/gemini-api/docs/audio)
inputs and understanding.

## Streaming responses

By default, the model returns a response only after the entire generation
process is complete.

For more fluid interactions, use streaming to receive [`GenerateContentResponse`](https://ai.google.dev/api/generate-content#v1beta.GenerateContentResponse) instances incrementally
as they're generated.

### Python

    from google import genai

    client = genai.Client()

    response = client.models.generate_content_stream(
        model="gemini-3-flash-preview",
        contents=["Explain how AI works"]
    )
    for chunk in response:
        print(chunk.text, end="")

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: "Explain how AI works",
      });

      for await (const chunk of response) {
        console.log(chunk.text);
      }
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "os"
      "google.golang.org/genai"
    )

    func main() {

      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      stream := client.Models.GenerateContentStream(
          ctx,
          "gemini-3-flash-preview",
          genai.Text("Write a story about a magic backpack."),
          nil,
      )

      for chunk, _ := range stream {
          part := chunk.Candidates[0].Content.Parts[0]
          fmt.Print(part.Text)
      }
    }

### Java

    import com.google.genai.Client;
    import com.google.genai.ResponseStream;
    import com.google.genai.types.GenerateContentResponse;

    public class GenerateContentStream {
      public static void main(String[] args) {

        Client client = new Client();

        ResponseStream<GenerateContentResponse> responseStream =
          client.models.generateContentStream(
              "gemini-3-flash-preview", "Write a story about a magic backpack.", null);

        for (GenerateContentResponse res : responseStream) {
          System.out.print(res.text());
        }

        // To save resources and avoid connection leaks, it is recommended to close the response
        // stream after consumption (or using try block to get the response stream).
        responseStream.close();
      }
    }

### REST

    curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      --no-buffer \
      -d '{
        "contents": [
          {
            "parts": [
              {
                "text": "Explain how AI works"
              }
            ]
          }
        ]
      }'

### Apps Script

    // See https://developers.google.com/apps-script/guides/properties
    // for instructions on how to set the API key.
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    function main() {
      const payload = {
        contents: [
          {
            parts: [
              { text: 'Explain how AI works' },
            ],
          },
        ],
      };

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent';
      const options = {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey,
        },
        payload: JSON.stringify(payload)
      };

      const response = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(response);
      const content = data['candidates'][0]['content']['parts'][0]['text'];
      console.log(content);
    }

## Multi-turn conversations (chat)

Our SDKs provide functionality to collect multiple rounds of prompts and
responses into a chat, giving you an easy way to keep track of the conversation
history.

> [!NOTE]
> **Note:** Chat functionality is only implemented as part of the SDKs. Behind the scenes, it still uses the [`generateContent`](https://ai.google.dev/api/generate-content#method:-models.generatecontent) API. For multi-turn conversations, the full conversation history is sent to the model with each follow-up turn.

### Python

    from google import genai

    client = genai.Client()
    chat = client.chats.create(model="gemini-3-flash-preview")

    response = chat.send_message("I have 2 dogs in my house.")
    print(response.text)

    response = chat.send_message("How many paws are in my house?")
    print(response.text)

    for message in chat.get_history():
        print(f'role - {message.role}',end=": ")
        print(message.parts[0].text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        history: [
          {
            role: "user",
            parts: [{ text: "Hello" }],
          },
          {
            role: "model",
            parts: [{ text: "Great to meet you. What would you like to know?" }],
          },
        ],
      });

      const response1 = await chat.sendMessage({
        message: "I have 2 dogs in my house.",
      });
      console.log("Chat response 1:", response1.text);

      const response2 = await chat.sendMessage({
        message: "How many paws are in my house?",
      });
      console.log("Chat response 2:", response2.text);
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "os"
      "google.golang.org/genai"
    )

    func main() {

      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      history := []*genai.Content{
          genai.NewContentFromText("Hi nice to meet you! I have 2 dogs in my house.", genai.RoleUser),
          genai.NewContentFromText("Great to meet you. What would you like to know?", genai.RoleModel),
      }

      chat, _ := client.Chats.Create(ctx, "gemini-3-flash-preview", nil, history)
      res, _ := chat.SendMessage(ctx, genai.Part{Text: "How many paws are in my house?"})

      if len(res.Candidates) > 0 {
          fmt.Println(res.Candidates[0].Content.Parts[0].Text)
      }
    }

### Java

    import com.google.genai.Chat;
    import com.google.genai.Client;
    import com.google.genai.types.Content;
    import com.google.genai.types.GenerateContentResponse;

    public class MultiTurnConversation {
      public static void main(String[] args) {

        Client client = new Client();
        Chat chatSession = client.chats.create("gemini-3-flash-preview");

        GenerateContentResponse response =
            chatSession.sendMessage("I have 2 dogs in my house.");
        System.out.println("First response: " + response.text());

        response = chatSession.sendMessage("How many paws are in my house?");
        System.out.println("Second response: " + response.text());

        // Get the history of the chat session.
        // Passing 'true' to getHistory() returns the curated history, which excludes
        // empty or invalid parts.
        // Passing 'false' here would return the comprehensive history, including
        // empty or invalid parts.
        ImmutableList<Content> history = chatSession.getHistory(true);
        System.out.println("History: " + history);
      }
    }

### REST

    curl https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -X POST \
      -d '{
        "contents": [
          {
            "role": "user",
            "parts": [
              {
                "text": "Hello"
              }
            ]
          },
          {
            "role": "model",
            "parts": [
              {
                "text": "Great to meet you. What would you like to know?"
              }
            ]
          },
          {
            "role": "user",
            "parts": [
              {
                "text": "I have two dogs in my house. How many paws are in my house?"
              }
            ]
          }
        ]
      }'

### Apps Script

    // See https://developers.google.com/apps-script/guides/properties
    // for instructions on how to set the API key.
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    function main() {
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Hello' },
            ],
          },
          {
            role: 'model',
            parts: [
              { text: 'Great to meet you. What would you like to know?' },
            ],
          },
          {
            role: 'user',
            parts: [
              { text: 'I have two dogs in my house. How many paws are in my house?' },
            ],
          },
        ],
      };

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
      const options = {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey,
        },
        payload: JSON.stringify(payload)
      };

      const response = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(response);
      const content = data['candidates'][0]['content']['parts'][0]['text'];
      console.log(content);
    }

Streaming can also be used for multi-turn conversations.

### Python

    from google import genai

    client = genai.Client()
    chat = client.chats.create(model="gemini-3-flash-preview")

    response = chat.send_message_stream("I have 2 dogs in my house.")
    for chunk in response:
        print(chunk.text, end="")

    response = chat.send_message_stream("How many paws are in my house?")
    for chunk in response:
        print(chunk.text, end="")

    for message in chat.get_history():
        print(f'role - {message.role}', end=": ")
        print(message.parts[0].text)

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        history: [
          {
            role: "user",
            parts: [{ text: "Hello" }],
          },
          {
            role: "model",
            parts: [{ text: "Great to meet you. What would you like to know?" }],
          },
        ],
      });

      const stream1 = await chat.sendMessageStream({
        message: "I have 2 dogs in my house.",
      });
      for await (const chunk of stream1) {
        console.log(chunk.text);
        console.log("_".repeat(80));
      }

      const stream2 = await chat.sendMessageStream({
        message: "How many paws are in my house?",
      });
      for await (const chunk of stream2) {
        console.log(chunk.text);
        console.log("_".repeat(80));
      }
    }

    await main();

### Go

    package main

    import (
      "context"
      "fmt"
      "os"
      "google.golang.org/genai"
    )

    func main() {

      ctx := context.Background()
      client, err := genai.NewClient(ctx, nil)
      if err != nil {
          log.Fatal(err)
      }

      history := []*genai.Content{
          genai.NewContentFromText("Hi nice to meet you! I have 2 dogs in my house.", genai.RoleUser),
          genai.NewContentFromText("Great to meet you. What would you like to know?", genai.RoleModel),
      }

      chat, _ := client.Chats.Create(ctx, "gemini-3-flash-preview", nil, history)
      stream := chat.SendMessageStream(ctx, genai.Part{Text: "How many paws are in my house?"})

      for chunk, _ := range stream {
          part := chunk.Candidates[0].Content.Parts[0]
          fmt.Print(part.Text)
      }
    }

### Java

    import com.google.genai.Chat;
    import com.google.genai.Client;
    import com.google.genai.ResponseStream;
    import com.google.genai.types.GenerateContentResponse;

    public class MultiTurnConversationWithStreaming {
      public static void main(String[] args) {

        Client client = new Client();
        Chat chatSession = client.chats.create("gemini-3-flash-preview");

        ResponseStream<GenerateContentResponse> responseStream =
            chatSession.sendMessageStream("I have 2 dogs in my house.", null);

        for (GenerateContentResponse response : responseStream) {
          System.out.print(response.text());
        }

        responseStream = chatSession.sendMessageStream("How many paws are in my house?", null);

        for (GenerateContentResponse response : responseStream) {
          System.out.print(response.text());
        }

        // Get the history of the chat session. History is added after the stream
        // is consumed and includes the aggregated response from the stream.
        System.out.println("History: " + chatSession.getHistory(false));
      }
    }

### REST

    curl https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H 'Content-Type: application/json' \
      -X POST \
      -d '{
        "contents": [
          {
            "role": "user",
            "parts": [
              {
                "text": "Hello"
              }
            ]
          },
          {
            "role": "model",
            "parts": [
              {
                "text": "Great to meet you. What would you like to know?"
              }
            ]
          },
          {
            "role": "user",
            "parts": [
              {
                "text": "I have two dogs in my house. How many paws are in my house?"
              }
            ]
          }
        ]
      }'

### Apps Script

    // See https://developers.google.com/apps-script/guides/properties
    // for instructions on how to set the API key.
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    function main() {
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Hello' },
            ],
          },
          {
            role: 'model',
            parts: [
              { text: 'Great to meet you. What would you like to know?' },
            ],
          },
          {
            role: 'user',
            parts: [
              { text: 'I have two dogs in my house. How many paws are in my house?' },
            ],
          },
        ],
      };

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent';
      const options = {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey,
        },
        payload: JSON.stringify(payload)
      };

      const response = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(response);
      const content = data['candidates'][0]['content']['parts'][0]['text'];
      console.log(content);
    }

## Prompting tips

Consult our [prompt engineering guide](https://ai.google.dev/gemini/docs/prompting-strategies) for
suggestions on getting the most out of Gemini.

## What's next

- Try [Gemini in Google AI Studio](https://aistudio.google.com).
- Experiment with [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output) for JSON-like responses.
- Explore Gemini's [image](https://ai.google.dev/gemini-api/docs/image-understanding), [video](https://ai.google.dev/gemini-api/docs/video-understanding), [audio](https://ai.google.dev/gemini-api/docs/audio) and [document](https://ai.google.dev/gemini-api/docs/document-processing) understanding capabilities.
- Learn about multimodal [file prompting strategies](https://ai.google.dev/gemini-api/docs/files#prompt-guide).