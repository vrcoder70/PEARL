import pandas as pd
data = pd.read_csv("yash-shah-code/Twitter/csvs/username_to_id.csv")
print('chrisbryanASU' in data['username'].to_list())
print(data['username'])