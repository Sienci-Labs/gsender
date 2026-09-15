class Blocker {
    blocked = false;
    callback: Function = null;

    block(func: Function) {
        this.callback = func;
        this.blocked = true;
    }

    proceed() {
        this.blocked = false;
        this.callback();
    }

    reset() {
        this.callback = null;
        this.blocked = false;
    }
}

export default Blocker;
