"""
Author: Doris Zhou
Date: September 29, 2017
Performs sentiment analysis on a text file using the NLTK's sentiment analysis function.
Parameters:
    --dir [path of directory]
        specifies directory of files to analyze
    --file [path of text file]
        specifies location of specific file to analyze
    --out [path of directory]
        specifies directory to create output files
"""

import csv
import sys
import os
import time
import argparse
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk import tokenize
import nltk

# performs sentiment analysis on inputFile using the NLTK, outputting results to a new CSV file in outputDir
def analyzefile(input_file, output_dir):
    """
    Performs sentiment analysis on the text file given as input using the ANEW database.
    Outputs results to a new CSV file in output_dir.
    :param input_file: path of .txt file to analyze
    :param output_dir: path of directory to create new output file
    :return:
    """
    output_file = os.path.join(output_dir, "Output_Vader_Sentiment_" + os.path.basename(input_file).rstrip('.txt') + ".csv")

    # read file into string
    with open(input_file, 'r') as myfile:
        fulltext = myfile.readlines()
    # end method if file is empty
    #if len(fulltext) < 1:
    #    print('Empty file.')
    #    return
    
    #sentences = tokenize.word_tokenize(fulltext)  # split text into sentences
    sid = SentimentIntensityAnalyzer()  # create sentiment analyzer
    i = 1  # to store sentence index

    # check each word in sentence for sentiment and write to output_file
    with open(output_file, 'w', newline="") as csvfile:
        fieldnames = ['Sentence ID', 'Sentence', 'Sentiment', 'Sentiment Label']
        writer = csv.DictWriter(csvfile, 
                                fieldnames=fieldnames, 
                                delimiter=';',
                                lineterminator='\n',
                                #quoting=csv.QUOTE_NONE
                                )
        writer.writeheader()

        # analyze each sentence/line for sentiment

        for line in fulltext:
            s = nltk.word_tokenize(line.lower())
            ss = sid.polarity_scores(str(line))  # get sentiment scores
            print(s)
            # determine sentiment label (0 = negative, >0 = positive, <0 = negative)
            # score is determined from compound (normalized from (-1, 1))
            label = 'neutral'
            sentiment = ss['compound']
            if sentiment > 0:
                label = 'positive'
            elif sentiment < 0:
                label = 'negative'

            # write to output CSV
            writer.writerow({'Sentence ID': i,
                             'Sentence': s,
                             'Sentiment': sentiment,
                             'Sentiment Label': label,
                             })
            i += 1


def main(input_file, input_dir, output_dir):
    """
    Runs analyzefile on the appropriate files, provided that the input paths are valid.
    :param input_file:
    :param input_dir:
    :param output_dir:
    :return:
    """

    if len(output_dir) < 0 or not os.path.exists(output_dir):
        print('No output directory specified, or path does not exist.')
        sys.exit(1)
    elif len(input_file) == 0 and len(input_dir)  == 0:
        print('No input specified. Please give either a single file or a directory of files to analyze.')
        sys.exit(1)
    elif len(input_file) > 0:  # handle single file
        if os.path.exists(input_file):
            start_time = time.time()
            print("Starting sentiment analysis of " + input_file + "...")
            analyzefile(input_file, output_dir)
            print("Finished analyzing " + input_file + " in " + str((time.time() - start_time)) + " seconds")
        else:
            print('Input file "' + input_file + '" is invalid.')
            sys.exit(1)
    elif len(input_dir) > 0:  # handle directory
        if os.path.isdir(input_dir):
            directory = os.fsencode(input_dir)
            for file in os.listdir(directory):
                filename = os.path.join(input_dir, os.fsdecode(file))
                if filename.endswith(".txt"):
                    start_time = time.time()
                    print("Starting sentiment analysis of " + filename + "...")
                    analyzefile(filename, output_dir)
                    print("Finished analyzing " + filename + " in " + str((time.time() - start_time)) + " seconds")
        else:
            print('Input directory "' + input_dir + '" is invalid.')
            sys.exit(1)


if __name__ == '__main__':
    # get arguments from command line
    # get arguments below:
    input_file = '../data/emobank_text.txt'
    input_dir = ''#only for input directory
    output_dir = '../out/'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # run main with arguments above
    sys.exit(main(input_file, input_dir, output_dir))
