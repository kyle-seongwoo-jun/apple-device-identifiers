#!/bin/bash

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ] || [ -z "$MODEL" ]; then
  echo "OPENAI_API_KEY and MODEL are required" >&2
  exit 1
fi

# Get the diff content
DIFF_CONTENT=$(git diff HEAD | sed 's/"/\\"/g' | sed "s/'/\\'/g" | tr '\n' ' ')

if [ -z "$DIFF_CONTENT" ]; then
  echo "No changes detected" >&2
  exit 0
fi

# Generate the JSON body for the OpenAI API
JSON_BODY=$(cat <<EOF
{
  "model": "$MODEL",
  "messages": [{"role": "system", "content": "You are a helpful assistant generating git commit messages in Conventional Commits format."},
               {"role": "user", "content": "Generate a concise git commit message for the following changes: $DIFF_CONTENT"}],
  "temperature": 0.7
}
EOF
)

# Send the request to the OpenAI API
RESPONSE=$(curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "$JSON_BODY")

# Extract the commit message from the response
COMMIT_MSG=$(echo "$RESPONSE" | jq -r '.choices[0].message.content')

# Print the commit message
echo "$COMMIT_MSG"
