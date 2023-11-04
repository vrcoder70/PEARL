import requests
import os
import json
import pandas as pd

# To set your environment variables in your terminal run the following line:
# export 'BEARER_TOKEN'='<your_bearer_token>'
# bearer_token = os.environ.get("BEARER_TOKEN")
bearer_token = 'AAAAAAAAAAAAAAAAAAAAAF2miwEAAAAA6tPfnFTkfa8y3I34jxGFJpMbfWU%3DfocTBmHTh3sGgPG8gmks0miYObjlJ9nnRgCSQN2djXbqL7ZKb7'

csv_data = {'time' : [], 'tweet' : []}

#user_id = 17088423

def bearer_oauth(r):
    """
    Method required by bearer token authentication.
    """

    r.headers["Authorization"] = f"Bearer {bearer_token}"
    r.headers["User-Agent"] = "v2UserTweetsPython"
    return r



def create_url(user_id):
    # Replace with user ID below
    return "https://api.twitter.com/2/users/{}/tweets".format(user_id)


def get_params():
    # Tweet fields are adjustable.
    # Options include:
    # attachments, author_id, context_annotations,
    # conversation_id, created_at, entities, geo, id,
    # in_reply_to_user_id, lang, non_public_metrics, organic_metrics,
    # possibly_sensitive, promoted_metrics, public_metrics, referenced_tweets,
    # source, text, and withheld
    return {"tweet.fields": "created_at", "max_results" : 100}


def bearer_oauth(r):
    """
    Method required by bearer token authentication.
    """

    r.headers["Authorization"] = f"Bearer {bearer_token}"
    r.headers["User-Agent"] = "v2UserTweetsPython"
    return r


def connect_to_endpoint(url, params):
    response = requests.request("GET", url, auth=bearer_oauth, params=params)
    #print(response.status_code)
    if response.status_code != 200:
        raise Exception(
            "Request returned an error: {} {}".format(
                response.status_code, response.text
            )
        )
    return response.json()

def convert_to_csv(json_response):
    data = json_response['data']
    for obj in data:
        csv_data['time'].append(obj['created_at'])
        csv_data['tweet'].append(obj['text'])
    return None


def main():
    db = pd.read_csv('yash-shah-code/Twitter/csvs/username_to_id.csv')
    user_name = input("Please enter username : ")
    username_to_id_url = f'https://api.twitter.com/2/users/by/username/{user_name}'
    user_id = requests.request("GET", username_to_id_url, auth=bearer_oauth).json()["data"]["id"]
    url = create_url(user_id)
    params = get_params()
    json_response = connect_to_endpoint(url, params)
    if json_response["meta"]['result_count'] > 0:
        convert_to_csv(json_response)
    print('next_token' in json_response['meta'].keys())
    while ('next_token' in json_response['meta'].keys()):
        #print('next_token' in json_response['meta'].keys())
        params['pagination_token'] = json_response['meta']['next_token']
        json_response = connect_to_endpoint(url, params)
        #print("New Line")
        if json_response["meta"]['result_count'] > 0:
            convert_to_csv(json_response)
        print(json.dumps(json_response, indent=4, sort_keys=True))
    print("Loop Completed")
    if user_name in db['username']:
        pass
    else:
        temp = pd.DataFrame([[user_name, user_id]])
        temp.to_csv('yash-shah-code/Twitter/csvs/username_to_id.csv', mode='a', index=False, header=False)
    df = pd.DataFrame(csv_data)
    #print(df)
    df.to_csv(f'yash-shah-code/Twitter/csvs/{user_id}.csv', index=None)




if __name__ == "__main__":
    main()
    