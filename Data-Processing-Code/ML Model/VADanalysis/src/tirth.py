"""
Author: Doris Zhou
Modified by B.T. Atmaja (btatmaja@gmail.com)
Modified by Tirth Patel (tirthasheshpatel@gmail.com) and Yash Shah ()
Date: November 27, 2022

Performs sentiment analysis on a text file using ANEW.
"""

import csv
import sys
import requests
import os
import json
import pathlib
import statistics
import numpy as np
import pandas as pd
import nltk
from nltk import tokenize
from nltk.corpus import stopwords
from nltk.stem.wordnet import WordNetLemmatizer

# Download this if you haven't already.
# nltk.download('stopwords')
# nltk.download('punkt')
# nltk.download('wordnet')
# nltk.download('averaged_perceptron_tagger')
# nltk.download('omw-1.4')


FILE = pathlib.Path(__file__).parent.absolute()

os.environ["KERAS_BACKEND"] = "theano"
sys.path.append(os.path.join(FILE, "../../../twitter-emotion-recognition"))


from emotion_predictor import EmotionPredictor


# To set your environment variables in your terminal run the following line:
# export 'BEARER_TOKEN'='<your_bearer_token>'
# bearer_token = os.environ.get("BEARER_TOKEN")
bearer_token = "AAAAAAAAAAAAAAAAAAAAAF2miwEAAAAA6tPfnFTkfa8y3I34jxGFJpMbfWU%3DfocTBmHTh3sGgPG8gmks0miYObjlJ9nnRgCSQN2djXbqL7ZKb7"

csv_data = {"time": [], "tweet": []}


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
    return {"tweet.fields": "created_at", "max_results": 100}


def bearer_oauth(r):
    """
    Method required by bearer token authentication.
    """

    r.headers["Authorization"] = f"Bearer {bearer_token}"
    r.headers["User-Agent"] = "v2UserTweetsPython"
    return r


def connect_to_endpoint(url, params):
    response = requests.request("GET", url, auth=bearer_oauth, params=params)
    if response.status_code != 200:
        raise Exception(
            "Request returned an error: {} {}".format(
                response.status_code, response.text
            )
        )
    return response.json()


def convert_to_csv(json_response):
    data = json_response["data"]
    for obj in data:
        csv_data["time"].append(obj["created_at"])
        csv_data["tweet"].append(obj["text"])
    return None


def main():
    global user_name
    db = pd.read_csv(
        os.path.join(FILE, "../../../Twitter/csvs/username_to_id.csv")
    )
    user_name = input("Please enter username : ")
    username_to_id_url = (
        f"https://api.twitter.com/2/users/by/username/{user_name}"
    )
    user_id = requests.request(
        "GET", username_to_id_url, auth=bearer_oauth
    ).json()["data"]["id"]
    if os.path.exists(
        os.path.join(FILE, f"../../../Twitter/csvs/{user_id}.csv")
    ):
        return user_id
    url = create_url(user_id)
    params = get_params()
    json_response = connect_to_endpoint(url, params)
    if json_response["meta"]["result_count"] > 0:
        convert_to_csv(json_response)
    print("next_token" in json_response["meta"].keys())
    while "next_token" in json_response["meta"].keys():
        params["pagination_token"] = json_response["meta"]["next_token"]
        json_response = connect_to_endpoint(url, params)
        if json_response["meta"]["result_count"] > 0:
            convert_to_csv(json_response)
        print(json.dumps(json_response, indent=4, sort_keys=True))
    print("Loop Completed")
    if user_name in db["username"].to_list():
        pass
    else:
        temp = pd.DataFrame([[user_name, user_id]])
        temp.to_csv(
            os.path.join(FILE, "../../../Twitter/csvs/username_to_id.csv"),
            mode="a",
            index=False,
            header=False,
        )
    df = pd.DataFrame(csv_data)
    df.to_csv(
        os.path.join(FILE, f"../../../Twitter/csvs/{user_id}.csv"), index=None
    )
    return user_id


user_id = main()
data = pd.read_csv(os.path.join(FILE, f"../../../Twitter/csvs/{user_id}.csv"))
with open(os.path.join(FILE, f"../txts/{user_id}.txt"), "a") as fi:
    for i in data["tweet"]:
        fi.write(i)


lmtzr = WordNetLemmatizer()
stops = set(stopwords.words("english"))
anew = os.path.join(FILE, "../lib/EnglishShortened.csv")
avg_V = 5.06  # average V from ANEW dict
avg_A = 4.21
avg_D = 5.18


# performs sentiment analysis on inputFile using the ANEW database, outputting results to a new CSV file in outputDir
def analyzefile(df, output_file, mode):
    """
    Performs sentiment analysis on the text file given as input using the ANEW database.

    Outputs results to a new CSV file in output_dir.

    :param input_file: path of .txt file to analyze
    :param output_dir: path of directory to create new output file
    :param mode: determines how sentiment values for a sentence are computed (median or mean)
    :return:
    """
    # make buffer for list of utterance
    utterances = []

    # writing file
    i = 1  # to store sentence/line index
    # check each word in sentence/line for sentiment and write to output_file
    with open(output_file, "w", newline="") as csvfile:
        print("File created")
        print(output_file)
        fieldnames = [
            "Sentence ID",
            "Sentence",
            "Valence",
            "Arousal",
            "Dominance",
            "Sentiment Label",
            "Average VAD",
            "# Words Found",
            "Found Words",
            "All Words",
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        # analyze each sentence/line for sentiment
        for line in df["tweet"]:
            s = tokenize.word_tokenize(line.lower())
            all_words = []
            found_words = []
            total_words = 0
            v_list = []  # holds valence scores
            a_list = []  # holds arousal scores
            d_list = []  # holds dominance scores

            # search for each valid word's sentiment in ANEW
            words = nltk.pos_tag(s)
            for index, p in enumerate(words):
                # don't process stops or words w/ punctuation
                w = p[0]
                pos = p[1]
                if w in stops or not w.isalpha():
                    continue

                # check for negation in 3 words before current word
                j = index - 1
                neg = False
                while j >= 0 and j >= index - 3:
                    if (
                        words[j][0] == "not"
                        or words[j][0] == "no"
                        or words[j][0] == "n't"
                    ):
                        neg = True
                        break
                    j -= 1

                # lemmatize word based on pos
                if pos[0] == "N" or pos[0] == "V":
                    lemma = lmtzr.lemmatize(w, pos=pos[0].lower())
                else:
                    lemma = w

                all_words.append(lemma)

                # search for lemmatized word in ANEW
                with open(anew) as csvfile:
                    reader = csv.DictReader(csvfile)
                    for row in reader:
                        if row["Word"].casefold() == lemma.casefold():
                            if neg:
                                found_words.append("neg-" + lemma)
                            else:
                                found_words.append(lemma)
                            v = float(row["valence"])
                            a = float(row["arousal"])
                            d = float(row["dominance"])

                            if neg:
                                # reverse polarity for this word
                                v = 5 - (v - 5)
                                a = 5 - (a - 5)
                                d = 5 - (d - 5)

                            v_list.append(v)
                            a_list.append(a)
                            d_list.append(d)

            if (
                len(found_words) == 0
            ):  # no words found in ANEW for this sentence
                writer.writerow(
                    {
                        "Sentence ID": i,
                        "Sentence": s,
                        "Valence": np.nan,
                        "Sentiment Label": np.nan,
                        "Arousal": np.nan,
                        "Dominance": np.nan,
                        "Average VAD": np.nan,
                        "# Words Found": 0,
                        "Found Words": np.nan,
                        "All Words": all_words,
                    }
                )
                i += 1
            else:  # output sentiment info for this sentence
                # get values
                if mode == "median":
                    sentiment = statistics.median(v_list)
                    arousal = statistics.median(a_list)
                    dominance = statistics.median(d_list)
                elif mode == "mean":
                    sentiment = statistics.mean(v_list)
                    arousal = statistics.mean(a_list)
                    dominance = statistics.mean(d_list)
                elif mode == "mika":
                    # calculate valence
                    if statistics.mean(v_list) < avg_V:
                        sentiment = max(v_list) - avg_V
                    elif max(v_list) < avg_V:
                        sentiment = avg_V - min(v_list)
                    else:
                        sentiment = max(v_list) - min(v_list)
                    # calculate arousal
                    if statistics.mean(a_list) < avg_A:
                        arousal = max(a_list) - avg_A
                    elif max(a_list) < avg_A:
                        arousal = avg_A - min(a_list)
                    else:
                        arousal = max(a_list) - min(a_list)
                    # calculate dominance
                    if statistics.mean(d_list) < avg_D:
                        dominance = max(d_list) - avg_D
                    elif max(d_list) < avg_D:
                        dominance = avg_D - min(a_list)
                    else:
                        dominance = max(d_list) - min(d_list)
                else:
                    raise Exception("Unknown mode")

                label = "neutral"
                if sentiment > 6:
                    label = "positive"
                elif sentiment < 4:
                    label = "negative"

                writer.writerow(
                    {
                        "Sentence ID": i,
                        "Sentence": s,
                        "Valence": sentiment,
                        "Arousal": arousal,
                        "Dominance": dominance,
                        "Average VAD": np.mean(
                            [sentiment, arousal, dominance]
                        ),
                        "Sentiment Label": label,
                        "# Words Found": (
                            "%d out of %d" % (len(found_words), len(all_words))
                        ),
                        "Found Words": found_words,
                        "All Words": all_words,
                    }
                )
                i += 1


def main(input_file, input_dir, output_file, mode):
    df = pd.read_csv(os.path.join(input_dir, input_file))
    print(df)
    analyzefile(df, output_file, mode)


if not os.path.exists(os.path.join(FILE, f"../outputs/{user_id}_final.csv")):
    input_file = os.path.join(FILE, f"../../../Twitter/csvs/{user_id}.csv")
    input_dir = ""
    mode = "mean"
    output_dir = os.path.join(FILE, "../outputs")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # run main with arguments above
    main(
        input_file, input_dir, os.path.join(output_dir, user_id + ".csv"), mode
    )

    try:
        os.chdir(os.path.join(FILE, "../../../twitter-emotion-recognition"))

        model = EmotionPredictor(
            classification="plutchik", setting="mc", use_unison_model=True
        )

        csv2 = pd.read_csv(
            os.path.join(FILE, f"../../../Twitter/csvs/{user_id}.csv")
        )
        predictions2 = model.predict_classes(csv2["tweet"])
        csv2["emotion"] = predictions2["Emotion"]
        csv2.to_csv(os.path.join(FILE, f"../outputs/{user_id}_temp1.csv"))

        csv1 = pd.read_csv(os.path.join(FILE, f"../outputs/{user_id}.csv"))
        csv2["Sentence"] = csv1["Sentence"]
        csv2["Valence"] = csv1["Valence"]
        csv2["Arousal"] = csv1["Arousal"]
        csv2["Dominance"] = csv1["Dominance"]
        csv2["Sentiment Label"] = csv1["Sentiment Label"]
        csv2["Average VAD"] = csv1["Average VAD"]
        csv2["# Words Found"] = csv1["# Words Found"]
        csv2["Found Words"] = csv1["Found Words"]
        csv2["All Words"] = csv1["All Words"]

        csv2.to_csv(os.path.join(FILE, f"../outputs/{user_id}_final.csv"))
    finally:
        os.chdir(FILE)


df = pd.read_csv(os.path.join(FILE, f"../outputs/{user_id}_final.csv"))
stream_df = pd.DataFrame(
    columns=[
        "id",
        "time",
        "Valence",
        "Arousal",
        "Dominance",
        "emotion",
        "Found Words",
        "Sadness",
        "Joy",
        "Trust",
        "Fear",
        "Surprise",
        "Anticipation",
        "Anger",
        "Disgust",
    ]
)


def findVal(num):
    return num, round((0.9 - num) / 7, 2)


for ind in df.index:
    val = df["Valence"][ind]
    ar = df["Arousal"][ind]
    dom = df["Dominance"][ind]
    if not np.isnan(val) and not np.isnan(ar) and not np.isnan(dom):
        emotion = df["emotion"][ind]
        val = round(val / 9, 2)
        ar = round(ar / 9, 2)
        dom = round(dom / 9, 2)
        vad = round(df["Average VAD"][ind] / 9, 2)

        if emotion == "Sadness":
            sad, oth = findVal(val)
            stream_df = stream_df.append(
                {
                    "id": df["Unnamed: 0"][ind],
                    "Valence": df["Valence"][ind],
                    "Arousal": df["Arousal"][ind],
                    "Dominance": df["Dominance"][ind],
                    "Found Words": df["Found Words"][ind],
                    "emotion": df["emotion"][ind],
                    "time": df["time"][ind],
                    "Sadness": sad,
                    "Joy": oth,
                    "Trust": oth,
                    "Fear": oth,
                    "Surprise": oth,
                    "Anticipation": oth,
                    "Anger": oth,
                    "Disgust": oth,
                },
                ignore_index=True,
            )
        elif emotion == "Joy":
            joy, oth = findVal(val)
            stream_df = stream_df.append(
                {
                    "id": df["Unnamed: 0"][ind],
                    "Valence": df["Valence"][ind],
                    "Arousal": df["Arousal"][ind],
                    "Dominance": df["Dominance"][ind],
                    "Found Words": df["Found Words"][ind],
                    "emotion": df["emotion"][ind],
                    "time": df["time"][ind],
                    "Sadness": oth,
                    "Joy": joy,
                    "Trust": oth,
                    "Fear": oth,
                    "Surprise": oth,
                    "Anticipation": oth,
                    "Anger": oth,
                    "Disgust": oth,
                },
                ignore_index=True,
            )
        elif emotion == "Trust":
            trust, oth = findVal(val)
            stream_df = stream_df.append(
                {
                    "id": df["Unnamed: 0"][ind],
                    "Valence": df["Valence"][ind],
                    "Arousal": df["Arousal"][ind],
                    "Dominance": df["Dominance"][ind],
                    "Found Words": df["Found Words"][ind],
                    "emotion": df["emotion"][ind],
                    "time": df["time"][ind],
                    "Sadness": oth,
                    "Joy": oth,
                    "Trust": trust,
                    "Fear": oth,
                    "Surprise": oth,
                    "Anticipation": oth,
                    "Anger": oth,
                    "Disgust": oth,
                },
                ignore_index=True,
            )
        elif emotion == "Fear":
            fear, oth = findVal(val)
            stream_df = stream_df.append(
                {
                    "id": df["Unnamed: 0"][ind],
                    "Valence": df["Valence"][ind],
                    "Arousal": df["Arousal"][ind],
                    "Dominance": df["Dominance"][ind],
                    "Found Words": df["Found Words"][ind],
                    "emotion": df["emotion"][ind],
                    "time": df["time"][ind],
                    "Sadness": oth,
                    "Joy": oth,
                    "Trust": oth,
                    "Fear": fear,
                    "Surprise": oth,
                    "Anticipation": oth,
                    "Anger": oth,
                    "Disgust": oth,
                },
                ignore_index=True,
            )
        elif emotion == "Surprise":
            surprise, oth = findVal(val)
            stream_df = stream_df.append(
                {
                    "id": df["Unnamed: 0"][ind],
                    "Valence": df["Valence"][ind],
                    "Arousal": df["Arousal"][ind],
                    "Dominance": df["Dominance"][ind],
                    "Found Words": df["Found Words"][ind],
                    "emotion": df["emotion"][ind],
                    "time": df["time"][ind],
                    "Sadness": oth,
                    "Joy": oth,
                    "Trust": oth,
                    "Fear": oth,
                    "Surprise": surprise,
                    "Anticipation": oth,
                    "Anger": oth,
                    "Disgust": oth,
                },
                ignore_index=True,
            )
        elif emotion == "Anticipation":
            anticipation, oth = findVal(val)
            stream_df = stream_df.append(
                {
                    "id": df["Unnamed: 0"][ind],
                    "Valence": df["Valence"][ind],
                    "Arousal": df["Arousal"][ind],
                    "Dominance": df["Dominance"][ind],
                    "Found Words": df["Found Words"][ind],
                    "emotion": df["emotion"][ind],
                    "time": df["time"][ind],
                    "Sadness": oth,
                    "Joy": oth,
                    "Trust": oth,
                    "Fear": oth,
                    "Surprise": oth,
                    "Anticipation": anticipation,
                    "Anger": oth,
                    "Disgust": oth,
                },
                ignore_index=True,
            )
        elif emotion == "Anger":
            Anger, oth = findVal(val)
            stream_df = stream_df.append(
                {
                    "id": df["Unnamed: 0"][ind],
                    "Valence": df["Valence"][ind],
                    "Arousal": df["Arousal"][ind],
                    "Dominance": df["Dominance"][ind],
                    "Found Words": df["Found Words"][ind],
                    "emotion": df["emotion"][ind],
                    "time": df["time"][ind],
                    "Sadness": oth,
                    "Joy": oth,
                    "Trust": oth,
                    "Fear": oth,
                    "Surprise": oth,
                    "Anticipation": oth,
                    "Anger": Anger,
                    "Disgust": oth,
                },
                ignore_index=True,
            )
        elif emotion == "Disgust":
            Disgust, oth = findVal(val)
            stream_df = stream_df.append(
                {
                    "id": df["Unnamed: 0"][ind],
                    "Valence": df["Valence"][ind],
                    "Arousal": df["Arousal"][ind],
                    "Dominance": df["Dominance"][ind],
                    "Found Words": df["Found Words"][ind],
                    "emotion": df["emotion"][ind],
                    "time": df["time"][ind],
                    "Sadness": oth,
                    "Joy": oth,
                    "Trust": oth,
                    "Fear": oth,
                    "Surprise": oth,
                    "Anticipation": oth,
                    "Anger": oth,
                    "Disgust": Disgust,
                },
                ignore_index=True,
            )

stream_df.to_csv(
    os.path.join(FILE, f"../../../../data/{user_name}.csv"), index=False
)
df.to_csv(os.path.join(FILE, "../../../../data/final.csv"), index=False)
