const options = [
  {
    type: 6,
    name: "user",
    description: "A user.",
  },
  {
    type: 3,
    name: "image-url",
    description: "An image URL.",
  },
  {
    type: 11,
    name: "image-file",
    description: "Upload an image from your file system.",
  },
];

export default {
  data: {
    name: "img",
    description: "Create funny images.",
    options: [
      {
        type: 1,
        name: "rap",
        description: "Rapper Rapunzel Rappu Singh.",
        options: options,
      },
      {
        type: 1,
        name: "goodness",
        description: "Oh my goodness graciousness.",
        options: options,
      },
      {
        type: 1,
        name: "nearyou",
        description: "I am near you.",
        options: options,
      },
      {
        type: 1,
        name: "vosahihai",
        description: "He's right, you know?",
        options: options,
      },
      {
        type: 1,
        name: "animan",
        description: "I put the new forgis on the jeep.",
        options: [
          {
            type: 6,
            name: "user1",
            description: "A user.",
            required: true,
          },
          {
            type: 6,
            name: "user2",
            description: "Next user.",
            required: true,
          },
          {
            type: 6,
            name: "user3",
            description: "Other user.",
            required: true,
          },
          {
            type: 6,
            name: "user4",
            description: "Another user.",
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "allustuff",
        description: "RDJ stuff but allu",
        options: [
          {
            type: 3,
            name: "caption",
            description: "The caption text for the image",
            required: true,
          },
          {
            type: 3,
            name: "image-url",
            description: "An image URL.",
          },
          {
            type: 11,
            name: "image-file",
            description: "Upload an image from your file system.",
          },
        ],
      },
      {
        type: 1,
        name: "lapata",
        description: "Become lapata or make someone lapata.",
        options: options.concat([
          {
            type: 6,
            name: "user2",
            description: "A user.",
          },
          {
            type: 6,
            name: "user3",
            description: "Next user.",
          },
          {
            type: 6,
            name: "user4",
            description: "Other user.",
          },
        ]),
      },
    ],
  },
};
