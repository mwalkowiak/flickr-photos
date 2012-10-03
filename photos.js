/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) {return callback(err);}

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
        
    }

    function renderPhoto (photo) {
        var imgStore = {};
        
        var img = new Image();
        img.src = photo;
        
        imgStore.photoUrl = photo;
        imgStore.photoImg = img;
        
        return imgStore;
    }

    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            
            var favTxt = 'Your favourite';
            var setFavTxt = 'Set as favourite';
            var favIcon = 'icon-heart';
            var setFavIcon = 'icon-heart-empty';
            
            // remove http://
            var itemId = encodeURIComponent(img.photoUrl.toString().substring(7));
            
            var elm = document.createElement('div');
            var a = document.createElement('a');
            a.className = 'btn btn-success';
            
            var btn = document.createElement('i');
            btn.className = (isCookieFav(itemId) ? favIcon : setFavIcon) + ' icon-large';
            btn.setAttribute('id', itemId);
            
            $(a).on('click', function () {
                var isFav = (isCookieFav(itemId));

                if (isFav) {
                    $(this).children('i').attr('class', setFavIcon);
                    $(this).children('i').text(setFavTxt);
                    deleteCookieValue(itemId);
                } else {
                    $(this).children('i').attr('class', favIcon);
                    $(this).children('i').text(favTxt);
                    setCookieValue(itemId);
                }
            });
            
            var txt = document.createTextNode(isCookieFav(itemId) ? favTxt : setFavTxt);
            btn.appendChild(txt);
            elm.className = 'photo';
            a.appendChild(btn);
            elm.appendChild(a);
            elm.appendChild(img.photoImg);
            holder.appendChild(elm);
        };
    }

    // get already saved values from cookie
    function getValues()
    {
        var cookie = document.cookie;
        var cookieVal = '';
        
        if (cookie != '' && cookie.indexOf('=') > 0) {
            cookieVal = cookie.split('=')[1];
        }
        
        return cookieVal;
    }

    // delete selected value from cookie
    function deleteCookieValue(imgName)
    {
        var favNames = getValues();
        
        var newCookieStr = '';
        
        if (favNames != "" && favNames.indexOf(',') > 0) {
            var favCollection = favNames.split(',');

            for (var i=0; i<favCollection.length; i++) {
                if (favCollection[i] != imgName) {
                    newCookieStr += (newCookieStr == '' ? favCollection[i] : ',' + favCollection[i]);
                }
            }
        }
        
        document.cookie = 'favpics='+newCookieStr;
    }

    // check if selected picture is already set as favourite or not
    function isCookieFav(imgName) 
    {   
        if (document.cookie == undefined || document.cookie == '') {
            return false;
        }
        
        var isFav = false;
        
        var favNames = getValues();
        if (favNames != '' && favNames.indexOf(',') > 0) {
            var favCollection = favNames.split(',');

            for (var i=0; i<favCollection.length; i++) {
                if (favCollection[i] == imgName) {
                    isFav = true;
                }
            }
        } else if (favNames == imgName) {
            isFav = true;
        }
        
        
        return isFav;
    }

    // append new value to cookie values representing favourite pictures selections
    function appendCookieValue(imgName)
    {
        var favNames = getValues();
        
        var favCollection = favNames.split(',');
        
        if (favCollection == '') {
            document.cookie += imgName;
        } else {
            var append = true;
        
            for (var i=0; i<favCollection.length; i++) {
                if (favCollection[i] == imgName) {
                    append = false;
                }
            }

            if (append) {
                document.cookie += ',' + imgName;
            }
        }
    }
    
    // initial function determines if we have to create a new cookie or just append another value
    function setCookieValue(imgName)
    {
        if (document.cookie == undefined || document.cookie == '') {
            document.cookie = 'favpics='+imgName;
        } else {
            appendCookieValue(imgName);
        }
    }

    // ----
    
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) {return callback(err);}
			
            each(items.map(renderPhoto), imageAppender('photos'));
            callback();
        });
        
        
    };
}(jQuery));
