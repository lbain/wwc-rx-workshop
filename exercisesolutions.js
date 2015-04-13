function ExerciseSolutions() {
    // For explanations of each exercise, see exercises.js
}

ExerciseSolutions.prototype.recentActivity = function (tweetStream, scheduler) {
    /*
        Implementation:
            - Sample a tweet every 5 seconds
            - Take each sampled tweet and map to some information to display

        See:
            sample  - http://reactivex.io/documentation/operators/sample.html
                    - http://tinyurl.com/rxjsdoc/sample.md
    */

    return tweetStream.sample(5000, scheduler);
}

ExerciseSolutions.prototype.tweetsPerMinute = function (tweetStream, scheduler) {
    /*
        There are (at least) a couple of ways of doing this.
        
        ** Option 1: Buffer the stream to take 1 minute chunks

        Buffer waits for a period of time, and then gives us an array of tweets for
        that period. So we can take buffers of all tweets in the last minute,
        and return the length of each buffer.
        
        This is a simple way of doing it, but we might get hundreds or thousands of
        tweets per minute, which are stored in the buffers. If we have a lot of tweets,
        we may be using a lot more memory than we need. We only care about the
        count, we don't actually use the tweets in the buffer.

        See:
            bufferWithTime  - http://reactivex.io/documentation/operators/buffer.html
                            - http://tinyurl.com/rxjsdoc/bufferwithtime.md

            map             - http://reactivex.io/documentation/operators/map.html
                            - http://tinyurl.com/rxjsdoc/select.md
    */

    var tweetsPerMinuteUsingBuffer =
        tweetStream.bufferWithTime(60000, scheduler)
                   .map(function (tweetsForMinute) { return tweetsForMinute.length; });



    /*  
        ** Option 2: Use Window to divide the stream into 1 minute windows

        We can also use the Window operator. Window divides the stream into many 
        streams that each represent a 1 minute window. We can then get the count
        of each 1 minute window. We never have to store each tweet, so we use
        less memory.

        The biggest difference between Buffer and Window is:
            - Buffer gives us the list of all tweets at the end of each minute
            - Window gives us a new stream of tweets at the start of each minute,
            and each new stream gives the tweets for that minute as they happen.

        This means that Window creates a stream of 1 minute streams. So after we
        take the count of each 1 minute stream, we have to merge all these together
        back into a single stream.


        See:
            windowWithTime  - http://reactivex.io/documentation/operators/window.html
                            - http://tinyurl.com/rxjsdoc/windowwithtime.md

            map             - http://reactivex.io/documentation/operators/map.html
                            - http://tinyurl.com/rxjsdoc/select.md

            count           - http://reactivex.io/documentation/operators/count.html
                            - http://tinyurl.com/rxjsdoc/count.md

            mergeAll        - http://reactivex.io/documentation/operators/merge.html
                            - http://tinyurl.com/rxjsdoc/mergeall.md
    */


    var tweetsPerMinuteUsingWindow =
            tweetStream.windowWithTime(60000, scheduler)
                       .map(function (tweetsForMinute) { return tweetsForMinute.count(); })
                       .mergeAll();


    // Switch these around to see how they work
    return tweetsPerMinuteUsingBuffer;
    //return tweetsPerMinuteUsingWindow;
}

ExerciseSolutions.prototype.interestingTweets = function (tweetStream, scheduler) {
    // Pick high retweet count, favourite count, tweets from user with many followers

    var highFollowerCount = 100000;
    var highFavouriteCount = 100;
    var highRetweetCount = 100;

    return tweetStream
        .map(function (t) { return t.retweetedTweet ? t.retweetedTweet : t;})
        .filter(function (t) {
            return t.followers > highFollowerCount
                || t.retweetCount > highRetweetCount
                || t.favouriteCount > highFavouriteCount;
        })
        .distinct(function (t) { return t.retweetedTweet ? t.retweetedTweet.tweetId : t.tweetId; })
}

ExerciseSolutions.prototype.trending = function (tweetStream, scheduler) {
    return tweetStream.windowWithTime(60000, scheduler)
                    .flatMap(function (window) { 
                        return window.flatMap(function (t) {
                            return Rx.Observable.from(t.hashtags);
                        })
                                     .groupBy(function (ht) {
                                         return ht;
                                     })
                                     .flatMap(function (hashtagTweets) {
                                         return hashtagTweets.count();
                                     },
                                              function (hashtagTweets, count) {
                                                  return { hashtag: hashtagTweets.key, count: count };
                                              })
                            .filter(function (ht) { return ht.count > 5; })
                        .toArray();
                    });
}