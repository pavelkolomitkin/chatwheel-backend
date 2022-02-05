export function aggregate(next) {

    this.pipeline().unshift({ $match: { deleted: false } });
    next();
}
