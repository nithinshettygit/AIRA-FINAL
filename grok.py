from groq import Groq
import os

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

chat_completion = client.chat.completions.create(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Why does the Earth orbit the Sun?"}
    ],
    model="llama3-70b-8192",  # or "mixtral-8x7b-32768"
)

print(chat_completion.choices[0].message.content)
