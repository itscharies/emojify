export class IdGenerator {
    private count: number = 0;
    private prefix: string = 'id';

    contructor(prefix: string) {
        this.prefix = prefix;
    }

    next(): string {
        return `${this.prefix}${this.count++}`;
    }
}