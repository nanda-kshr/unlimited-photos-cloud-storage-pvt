
## Unlimited Cloud - Telegram Bot Integration

Welcome to the Unlimited Cloud project! This application allows you to integrate with Telegram and MongoDB to create a seamless cloud-based solution. Follow the steps below to configure the application and get started.

Hosted Website - [UnlimCloud](https://unlimited-photos-cloud-storage.vercel.app)

### Version - 1

### How to Obtain the Required Values for the `.env` File

To configure the application, you need to set up a `.env` file with the following values:

```
BOT_TOKEN=BOT_TOKEN
MONGODB_URI=MONGO-URI
MONGODB_COLLECTION=MONGO_COLLECTION
CHAT_ID=TELEGRAM_CHAT_ID
```

Here’s how you can obtain each of these values:

#### 1. `BOT_TOKEN`
- Go to [Telegram's BotFather](https://t.me/botfather) and create a new bot.
- Follow the instructions provided by BotFather to set up your bot.
- Once the bot is created, BotFather will provide you with a token. Copy this token and use it as the value for `BOT_TOKEN`.

#### 2. `MONGODB_URI`
- If you don’t already have a MongoDB database, create one using [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or set up a local MongoDB instance.
- For MongoDB Atlas:
    - Sign in to your account and create a new cluster.
    - Once the cluster is ready, click on "Connect" and follow the instructions to get the connection string.
    - Replace `<username>` and `<password>` in the connection string with your database credentials.
- Use this connection string as the value for `MONGODB_URI`.

#### 3. `MONGODB_COLLECTION`
- Decide on the name of the collection you want to use in your MongoDB database.
- If the collection does not exist, it will be created automatically when you insert data.
- Use this collection name as the value for `MONGODB_COLLECTION`.

#### 4. `CHAT_ID`
- Open Telegram and create a channel.
- Send a message in your channel or group in Telegram  
- Forward that message to @JsonDumpBot. 
  The bot dumps a complete JSON of all request that he receives

    ```
    "forward_origin": {
      "type": "channel",
      "chat": {
        "id": -1002421310208,
      }
    }
    ```
- Use the `id` as `CHAT_ID`. Note that private channel IDs start with `-100`.



  Still not clear? :- [Follow this](https://neliosoftware.com/content/help/how-do-i-get-the-channel-id-in-telegram/)


Once you have all these values, create a `.env` file in the root of your project and add the following:

```
BOT_TOKEN=<your_bot_token>
MONGODB_URI=<your_mongodb_uri>
MONGODB_COLLECTION=<your_mongodb_collection>
CHAT_ID=<your_chat_id>
```

Save the file and restart your application to apply the changes.