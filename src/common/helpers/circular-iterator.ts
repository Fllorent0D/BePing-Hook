export interface LinkedListNode<T> {
    value: T;
    next?: LinkedListNode<T>;
}

export class CircularIterator<T> {
    public head?: LinkedListNode<T> = undefined;
    public tail?: LinkedListNode<T> = undefined;

    /**
     * Adds an item in O(1)
     **/
    add(value: T) {
        const node = {
            value,
            next: this.head
        };
        if (!this.head) {
            this.head = node;
            node.next = node;
        }
        if (this.tail) {
            this.tail.next = node;
        }
        this.tail = node;
    }

    /**
     * Returns an iterator over the values
     */
    *values() {
        let current = this.head;
        while (current) {
            yield current.value;
            current = current.next;
        }
    }
}
