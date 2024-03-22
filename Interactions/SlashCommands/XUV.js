const commands = {
  data: {
    name: "xuv",
    description: "AI commands from the future",
    options: [
      {
        type: 1,
        name: "genesis",
        description: "Generate an AI image",
        options: [
          {
            type: 3,
            name: "prompt",
            description: "The prompt to generate",
            required: true
          }
        ]
      },
      {
        type: 1,
        name: "gpt",
        description: "Danky dank GPT funny jokes",
        options: [
          {
            type: 3,
            name: "message",
            description: "Your message to send 😂🙌🏽",
            required: true
          }
        ]
      },
      {
        type: 1,
        name: "padhaku",
        description: "Ask study-related (real) questions 🤓",
        options: [
          {
            type: 3,
            name: "query",
            description: "Your question:",
            required: true
          }
        ]
      },
      {
        type: 1,
        name: "ytsummarise",
        description: "Summarize YouTube videos with ease.",
        options: [
          {
            type: 3,
            name: "yt-url",
            description: "A YouTube video URL",
            required: true
          }
        ]
      }
    ]
  }
};

export default commands;