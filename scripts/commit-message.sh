#!/bin/bash

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ] || [ -z "$MODEL" ]; then
  echo "OPENAI_API_KEY and MODEL are required" >&2
  exit 1
fi

# Get the diff content
GIT_DIFF=$(git diff HEAD)

if [ -z "$GIT_DIFF" ]; then
  echo "No changes detected" >&2
  exit 0
fi

# Generate the JSON body for the OpenAI API
JSON_BODY=$(cat <<EOF
{
  "model": "$MODEL",
  "input": [{"role": "system", "content": "You are a helpful assistant generating git commit messages in Conventional Commits format. Generate a concise git commit message from \`git diff\`. Please do not include any other text in your response including \`\`\`"},
            {"role": "user", "content": $(jq -Rs . <<<"$GIT_DIFF")}],
  "temperature": 0.7
}
EOF
)

# Send the request to the OpenAI API
RESPONSE=$(curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "$JSON_BODY")

# Extract the commit message from the response
COMMIT_MSG=$(echo "$RESPONSE" | jq -r '.output[] | select(.type == "message") | .content[0] .text')

# Print the commit message
echo "$COMMIT_MSG"
