import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv('MONGO_URL'))
db = client['fintech_db']

print("Cols in fintech_db:", db.list_collection_names())

user_id = "69d8fd9db1d32cd0c686f472"
for c in db.list_collection_names():
    from bson.objectid import ObjectId
    docs = list(db[c].find({"user_id": user_id}))
    if not docs:
        docs = list(db[c].find({"user_id": ObjectId(user_id)}))
    if docs:
        print(f"\nCollection {c}:", docs)
    
    docs_id = list(db[c].find({"_id": user_id}))
    if not docs_id:
        docs_id = list(db[c].find({"_id": ObjectId(user_id)}))
    if docs_id:
        print(f"\nCollection {c} by _id:", docs_id)
