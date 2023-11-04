import pandas as pd
data = pd.read_csv('/Users/yashshah/ASU Documents/Fall 22/CSE 578 Data Visualisation/Project/Mukesh-Shubham-Tirth-Tirth-Vraj-Yash/yash-shah-code/Twitter/csvs/2835653131.csv')
print(str(data['tweet']))
with open('cur_input.txt', 'a') as f:
    for i in data['tweet']:
        f.write(i)
