(function () {
    function Queue(options) {
        if (!(this instanceof Queue)) return new Queue(options);
        options = options || {};
        this.concurrency = options.concurrency || Infinity;
        this.timeout = options.timeout || 0;
        this.autostart = options.autostart || false;
        this._queue = [];
        this._active = 0;
        this._ended = false;
        this._events = {};
        this._started = false;
        if (this.autostart) this.start();
    }

    Queue.prototype.on = function (event, fn) {
        (this._events[event] = this._events[event] || []).push(fn);
        return this;
    };

    Queue.prototype.emit = function (event) {
        var args = Array.prototype.slice.call(arguments, 1);
        (this._events[event] || []).forEach(function (fn) { fn.apply(null, args); });
        return this;
    };

    Queue.prototype.push = function (fn) {
        if (this._ended) return this;
        this._queue.push(fn);
        if (!this._lengthDefined) {
            Object.defineProperty(this, 'length', { get: function () { return this._queue.length + this._active; } });
            this._lengthDefined = true;
        }
        if (this._started) this._next();
        return this;
    };

    Queue.prototype.start = function (cb) {
        if (cb) this.on('end', cb);
        this._started = true;
        this._next();
        return this;
    };

    Queue.prototype._next = function () {
        var self = this;
        if (!this._started) return;
        if (this._ended) return;

        while (this._active < this.concurrency && this._queue.length > 0) {
            var fn = this._queue.shift();
            this._active++;

            (function (fn) {
                var timeoutId;
                if (self.timeout) {
                    timeoutId = setTimeout(function () {
                        self._active--;
                        self._next();
                    }, self.timeout);
                }

                try {
                    fn(function (result) {
                        if (timeoutId) clearTimeout(timeoutId);
                        self._active--;
                        self.emit('success', result, fn);
                        self._next();
                    }, self._active);
                } catch (e) {
                    if (timeoutId) clearTimeout(timeoutId);
                    self._active--;
                    self._next();
                }
            })(fn);
        }

        if (this._active === 0 && this._queue.length === 0) {
            this._started = false;
            this.emit('end');
        }
    };

    Queue.prototype.end = function () {
        this._ended = true;
        this._queue = [];
        return this;
    };

    window.queue = Queue;
})();
