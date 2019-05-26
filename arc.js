/*


# Arc.js
adheres to the design principles of consistent ordering, consistent naming conventions,
vigilant input validation, stringent structure, stringent linting, and minimal function branches.

## Arc-util
provides a language abstraction library similar to underscore.js.
It contains support for type checking, object iterating, object extending, object cloning,
string manipulation, and more.

## Arc-comm
provides a registry pattern, event pattern and more.

## Arc-dom
provides a DOM abstraction library similar to jquery.js.

## Arc-frame
provides a class emulation library with integrated DOM use.

## Arc-boot
provides a way to load resources via ajax and version control in localStorage


*/


/*jslint
 browser devel single this
*/


/*global
 $A $ window
*/


// Arc-util
// No Dependencies
//
//
(function () {
    'use strict';

    var nativeSlice = Array.prototype.slice;
    var nativeToString = Object.prototype.toString;
    var Pub = {};

    // Global management
    //
    Pub.globalManager = (function () {
        var pub = {};
        var glob_obj;
        var glob_prop;
        Pub.pack = {
            util: true
        };
        pub.release = function (where) {
            glob_obj[glob_prop] = Pub.extendSafe((glob_obj[glob_prop] || {}), where);
        };
        pub.setGlobal = function (global_obj, global_prop) {
            glob_obj = global_obj;
            glob_prop = global_prop;
        };
        return pub;
    }());
    Pub.globalManager.setGlobal(window, '$A');

    // Object Iterating
    //
    Pub.forEach = function (obj, func, con) {
        if (Pub.isType('Function', func)) {
            Object.keys(obj).forEach(function (key) {
                func.call(con, obj[key], key, obj);
            });
        }
        return true;
    };

    // Type Checking
    //
    Pub.getType = function (obj) {
        return nativeToString.call(obj).slice(8, -1);
    };
    Pub.isType = function (type, obj) {
        return Pub.getType(obj) === type;
    };
    Pub.isNative = function (check) {
        var t = Pub.getType(check);
        if (t === 'Number' || t === 'String' || t === 'Boolean' || t === 'Null' || t === 'Undefined') {
            return true;
        }
        return false;
    };

    // Object Extending and Cloning
    //
    Pub.extendFlat = function (obj) {
        if (Pub.isNative(obj)) {
            return obj;
        }
        Pub.forEach(nativeSlice.call(arguments, 1), function (object) {
            Pub.forEach(object, function (val, key) {
                obj[key] = val;
            });
        });
        return obj;
    };
    Pub.cloneFlat = function (obj) {
        return Pub.isArray(obj) ? obj.slice() : Pub.extendFlat({}, obj);
    };
    Pub.extendSafe = function (obj) {
        Pub.forEach(nativeSlice.call(arguments, 1), function (object) {
            Pub.forEach(object, function (val, key) {
                if (obj.hasOwnProperty(key)) {
                    throw new Error('naming collision: ' + key);
                }
                obj[key] = val;
            });
        });
        return obj;
    };

    // Objects and Keys
    //
    Pub.nextKey = function (obj, mark) {
        var key = '';
        if (Pub.isObj(obj)) {
            var arr = Object.keys(obj);
            var last = arr.length - 1;
            arr.forEach(function (val, index) {
                if (val === mark && (index === last)) {
                    key = arr[0];
                } else if (val === mark) {
                    key = arr[index + 1];
                }
            });
        }
        return key;
    };
    Pub.oneKey = function (obj) {
        var key = '';
        if (Pub.isObj(obj)) {
            var arr = Object.keys(obj);
            if (arr[0]) {
                key = arr[0];
            }
        }
        return key;
    };
    Pub.randomKey = function (obj) {
        var key = '';
        if (Pub.isObj(obj)) {
            var arr = Object.keys(obj);
            key = arr[Math.floor(Math.random() * arr.length)];
        }
        return key;
    };
    Pub.stringifyKeys = function (obj) {
        var key_string = '';
        if (Pub.isObj(obj)) {
            var arr = Object.keys(obj);
            arr.forEach(function (val) {
                key_string += val;
            });
        }
        return key_string;
    };

    // General use utility
    //
    Pub.someString = function (str, func, con) {
        var ret = '';
        if (Pub.isString(str)) {
            ret = Pub.forEach(str.split(/\s+/), func, con);
        }
        return ret;
    };
    Pub.morph = function (obj, func, con) {
        if (Pub.isType('Function', func)) {
            Pub.forEach(obj, function (val, key) {
                obj[key] = func.call(con, val);
            });
        }
        return obj;
    };
    Pub.lacks = function (obj) {
        Pub.forEach(nativeSlice.call(arguments, 1), function (object) {
            Pub.forEach(object, function (val, key) {
                if (obj[key] === undefined) {
                    obj[key] = val;
                }
            });
        });
        return obj;
    };
    Pub.globalManager.release(Pub);
}());


// Arc-comm
// No Dependencies
//
//
(function () {
    'use strict';

    // Global management
    //
    var Pub = {};
    var Imp = (function manageGlobal() {
        var Im = window['$A'];
        if (Im && Im.pack) {
            Im.pack.comm = true;
        }
        return Im;
    }());

    // Helper used to abstract looping
    //
    function forEach(obj, func, con) {
        Object.keys(obj).forEach(function (key) {
            func.call(con, obj[key], key, obj);
        });
    }

    // Registry pattern
    //
    Pub.Reg = (function () {
        var publik = {};
        var register = {};
        publik.get = function (key) {
            return register[key];
        };
        publik.set = function (key, value) {
            if (typeof key === 'string') {
                register[key] = value;
            }
        };
        publik.setMany = function () {
            forEach(arguments, function (obj) {
                forEach(obj, function (val_inner, key) {
                    register[key] = val_inner;
                });
            });
        };
        return publik;
    }());

    // Event pattern
    //
    Pub.Event = (function () {
        var publik = {};
        var events = {};
        publik.add = function (event_name, callback) {
            events[event_name] = events[event_name] || [];
            events[event_name].push(callback);
        };
        publik.remove = function (event_name, callback) {
            if (event_name && callback) {
                delete events[event_name][callback];
            } else if (event_name) {
                delete events[event_name];
            }
        };

        // trigger an event on all callbacks for that name
        publik.trigger = function (event_name) {
            if (events[event_name]) {
                forEach(events[event_name], function (val) {
                    val();
                });
            }
        };
        publik.release = function () {
            return events;
        };
        return publik;
    }());

    // Creates a string representing time elapsed
    //
    Pub.prettyTime = function (post_time) {
        var NORMALIZE = 1000;   // 1000 milliseconds in a second
        var MINUTE = 60;        // 60 seconds in a minute
        var HOUR = 3600;        // 3600 seconds in an hour
        var DAY = 43200;        // 43,200 seconds in a day

        // server time is in seconds while browser time is in milliseconds
        var current_time = Math.round(Date.now() / NORMALIZE);
        var rounded_time;
        var elapsed_time;
        var string = '';

        // synch factor actually exeeds transit time in some cases
        // post_time originates on the server as a unix time stamp
        // and current_time we calculate above
        if (current_time < post_time) {
            current_time = post_time;
        }
        elapsed_time = (current_time - post_time);
        if (elapsed_time === 0) {
            string = ' just a second ago';

        // 0 to 1 minute ago
        } else if ((elapsed_time > 0) && (elapsed_time < MINUTE)) {
            string = (elapsed_time === 1)
                ? 'one second ago'
                : (elapsed_time + ' seconds ago');

        // 1 minute to 1 hour ago
        } else if ((elapsed_time >= MINUTE) && (elapsed_time < HOUR)) {
            rounded_time = Math.floor(elapsed_time / MINUTE);
            string = (rounded_time === 1)
                ? 'one minute ago'
                : (rounded_time + ' minutes ago');

        // 1 hour to to 1 day ago
        } else if ((elapsed_time >= HOUR) && (elapsed_time < DAY)) {
            rounded_time = Math.floor(elapsed_time / HOUR);
            string = (rounded_time === 1)
                ? 'one hour ago'
                : (rounded_time + ' hours ago');

        // more than 1 day ago
        } else if (elapsed_time >= DAY) {
            rounded_time = new Date(post_time * NORMALIZE);
            string = 'on ' + rounded_time.toLocaleDateString();
        }
        return string;
    };
    Imp.globalManager.release(Pub);
}());


// Arc-dom
//
//
//
(function (win, doc) {
    'use strict';

    // Global management and more
    //
    var Pub = {};
    var Priv = {};
    var Imp = (function manageGlobal() {
        var Im = win['$A'];
        if (Im && Im.pack) {
            Im.pack.dom = true;
        }
        return Im;
    }());

    // Used for selecting DOM elements
    //
    Priv.SELECTOR = /^(@|#|\.)([\w\s]+)$/;

    // DOM Abstraction
    //
    Pub.log = function (obj) {
        if (win.console) {
            var temp = win.console.log;
            return temp.call(win.console, obj);
        }
    };
    Pub.toggleClass = function (el, name) {
        if (!Priv.hasClass(el, name)) {
            Priv.addClass(el, name);
        }
        var temp = Priv.isTogglable(name);
        if (temp) {
            Priv.removeClass(el, temp[1], temp[2]);
        }
    };
    Priv.hasClass = function (el, name) {
        return new RegExp('(\\s|^)' + name, 'g').test(el.className);
    };
    Priv.isTogglable = function (name) {
        return name.match(/toggle_(\w+)_(\w+)/);
    };
    Priv.addClass = function (el, name) {
        el.className += (el.className
            ? ' '
            : '') + name;
    };
    Priv.removeClass = function (el, namespace, name) {
        Imp.someString(el.className, function (val) {
            if (val.match(/toggle_/)) {
                var names = val.split(/_/);
                if (names[1] === namespace && names[2] !== name) {
                    Priv.removeClassInner(el, val);
                }
            }
        });
    };
    Priv.removeClassInner = function (el, val) {
        el.className = val
            ? el.className.replace(new RegExp('(\\s|^)' + val, 'g'), '')
            : '';
    };
    Pub.el = function (selector_native) {
        if (typeof selector_native === "string") {
            var tokens = selector_native.match(Priv.SELECTOR);
            var type;
            var identifier;
            if (!tokens || !tokens[1] || !tokens[2]) {
                return new Error('mal-formed selector');
            }
            type = tokens[1];
            identifier = tokens[2];
            if (type === '#') {
                return doc.getElementById(identifier);
            }
            if (type === '.' && doc.getElementsByClassName) {
                return doc.getElementsByClassName(identifier);
            }
            if (type === '@') {
                return doc.getElementsByName(identifier);
            }
            return new Error('unrecognized selector');
        }
    };
    Pub.removeElement = function (el) {
        if (el && el.parentNode) {
            return el.parentNode.removeChild(el);
        }
        return null;
    };
    Pub.replaceElement = function (el_old, el_new) {
        var parent_el = el_old.parentNode;
        if (parent_el) {
            Pub.removeElement(el_old);
            return parent_el.appendChild(el_new);
        }
        return null;
    };
    Pub.insertAfter = function (el, ref) {
        if (el && ref && ref.parentNode && ref.nextSibling) {
            return ref.parentNode.insertBefore(el, ref.nextSibling);
        }
        return null;
    };
    Pub.isElement = function (obj) {
        return !!(obj && obj.nodeType === 1);
    };
    Pub.someChild = function (parent, func, context) {
        if (Pub.isElement(parent) && typeof func === 'function') {
            var child = parent.firstChild;
            var result;
            do {
                if (!(child && child.nodeType === 3)) {
                    result = func.call(context, child, parent);
                    if (result !== undefined) {
                        return result;
                    }
                }
                child = child.nextSibling;
            } while (child !== null);
        }
        return null;
    };
    Pub.insertChildByIdAlpha = function (parent, child_insert) {
        Pub.someChild(parent, function (iter) {
            if (iter === null) {
                return parent.appendChild(child_insert);
            }
            if (child_insert.id < iter.id) {
                return parent.insertBefore(child_insert, iter);
            }
            if (iter === parent.lastChild) {
                return parent.appendChild(child_insert);
            }
        });
    };
    Pub.HTMLToElement = function (html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.firstChild;
    };
    Pub.appendHTMLAsElement = function (html, parent) {
        return parent.appendChild(Pub.HTMLToElement(html));
    };
    Imp.globalManager.release(Pub);
}(window, window.document));


// Arc-frame - a class emulation module
//
//
//
(function () {
    'use strict';

    // Global managment
    //
    var Pub = {};
    var Imp = (function manageGlobal() {
        var Im = window['$A'];
        if (Im && Im.pack) {
            Im.pack.frame = true;
        }
        return Im;
    }());

    // Class emulation
    //
    Pub.Obj = (function () {
        var _objects = {};
        var pub = {};
        pub.getAll = function () {
            return _objects;
        };
        pub.create = function (class_type, obj, obj_static) {
            // pub.addObj(obj);
            if (obj.E) {
                obj.E = pub.morpher(obj.E, Imp.el);
            }
            if (obj.J0) {
                obj.J0 = pub.morpher(obj.J0, $);
            }
            if (obj.J) {
                obj.J = pub.morpher(obj.J, $);
            }
            if (obj.init) {
                obj.init();
            }
            if (class_type === 'private') {
                return;
            }
            if (class_type === 'public') {
                return obj;
            }
            if (class_type === 'constructor') {
                var constructor_function;
                if (obj.constructor && typeof obj.constructor === 'function') {
                    constructor_function = obj.constructor;
                    _objects[obj.Name] = obj.constructor;
                    delete obj.constructor;
                } else {
                    constructor_function = function () {
                        return undefined;
                    };
                }
                if (obj !== undefined) {
                    Imp.forEach(obj, function (val, key) {
                        constructor_function.prototype[key] = val;
                    });
                }
                if (obj_static !== undefined) {
                    Imp.forEach(obj_static, function (val, key) {
                        constructor_function[key] = val;
                    });
                }
                return constructor_function;
            }
        };
        pub.morpher = function (collection, morpher) {
            var retval = {};
            if (Imp.getType(collection) === 'Object') {
                Imp.forEach(collection, function (val, key) {
                    collection[key] = morpher(val);
                });
            }
            if (Imp.getType(collection) === 'Array') {
                Imp.forEach(collection, function (val) {
                    retval[val] = morpher('#' + val);
                });
                collection = retval;
            }
            return collection;
        };
        pub.runAll = function (prop) {
            Imp.forEach(_objects, function (val) {
                if (val[prop]) {
                    val[prop]();
                }
            });
        };
        pub.run = function (name, prop) {
            if (name && prop) {
                _objects[name][prop]();
            }
        };
        return pub;
    }());
    Imp.globalManager.release(Pub);

}());


// Arc-boot
//
//
//
(function (win) {
    'use strict';

    // Global managment
    //
    var Pub = {};
    var Imp = (function manageGlobal() {
        var Im = window['$A'];
        if (Im && Im.pack) {
            Im.pack.boot = true;
        }
        return Im;
    }());

    // Ajax
    //
    Pub.ajax = function (config_ajax) {
        var xhr;
        if (config_ajax.type === 'get') {
            xhr = new win.XMLHttpRequest();
            xhr.open('GET', config_ajax.url, true);
            xhr.onload = function () {
                if (this.status === 200) {
                    config_ajax.callback(xhr.responseText);
                }
            };
            xhr.send(null);
        }
    };
    Pub.simpleAjaxCall = function (path, callback_func) {
        Pub.ajax({
            type: 'get',
            url: path,
            callback: callback_func
        });
    };

    // Booter - is used for booting files into localStorage
    //
    Pub.Booter = (function () {
        var pub = {};
        pub.bootAll = function (arr, version) {
            if (localStorage[version] && (localStorage[version] >= version)) {
                $A.log("Booter - Booting Local");
                arr.forEach(function (path) {
                    pub.bootLocal(path);
                });
            } else {
                $A.log("Booter - Booting from Server");
                arr.forEach(function (path) {
                    localStorage[version] = version;
                    pub.bootServer(path, version);
                });
            }
        };
        pub.bootLocal = function (path) {
            var o = pub.makeTypeAndToken(path);
            pub.addToDOM(o.type, o.token, localStorage[o.token]);
        };
        pub.bootServer = function (path) {
            var o = pub.makeTypeAndToken(path);
            path = path + '?_time=' + Date.now();
            Pub.simpleAjaxCall(path, function (response_text) {
                pub.addToDOM(o.type, o.token, response_text);
                localStorage[o.token] = response_text;
            });
        };
        pub.makeTypeAndToken = function (path) {
            var file_type = path.split('.').pop();
            var file_name = path.split('.').shift().replace('/', '_');
            var file_token = file_name + '_' + file_type;
            return {type: file_type, token: file_token};
        };
        pub.addToDOM = function (type, token, text) {
            var element;
            if (type === 'htm') {
                element = document.createElement('div');
                element.id = token;
                element.innerHTML = text;
                document.body.appendChild(element);
            } else if (type === 'js') {
                element = document.createElement('script');
                element.id = token;
                element.innerHTML = text;
                document.head.appendChild(element);
            } else if (type === 'css') {
                element = document.createElement('style');
                element.id = token;
                element.innerHTML = text;
                document.head.appendChild(element);
            }
        };
        return pub;
    }());
    Imp.globalManager.release(Pub);
}(window));


// Example Use
//
(function () {

    'use strict';

    $A.Reg.setMany({
        page_start: 'fave',
        path_favicons: '_favicons/',
        path_images: '_images/',
        path_svg: '_svg/',
        path_pictures: '_pictures/',
        path_ajax: 'stack_lamp/_controller.php'
    });

/*
    var Imp = (function manageGlobal() {
        var Im = window['$A'];
        if (Im && Im.pack) {
            Im.pack.configureApp = true;
        }
        return Im;
    }());

    // Example code for a sample application
    Imp.Obj.create('public', {
        Name: 'ConfigureApp',
        ver: 1491766921187,
        prod: true,
        init: function () {
            this.setProduction();

            // the files below were created by Grunt
            if (this.prod) {
                $A.Booter.bootAll([
                    '_build/monster.min.css',
                    '_build/monster.min.htm',
                    '_build/monster.min.js'
                ], this.ver);
            } else {
                $A.Booter.bootAll([
                    '_build/monster.css',
                    '_build/monster.htm',
                    '_build/monster.js'
                ], Date.now());
            }
        },
        setProduction: function () {
            if (location.hostname.split('.').pop() === 'com') {
                $A.log('Booting - Production - ' + this.ver);
            } else {
                $A.log('Booter - Debug - ' + this.ver);
                this.prod = false;
            }
        }
    });
    */

}());
