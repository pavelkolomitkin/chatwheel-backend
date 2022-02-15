
export const getPageLimitOffset = (page: number): {
    limit: number,
    offset: number
} => {

    if (page < 1)
    {
        page = 1;
    }

    const limit = 10;
    const offset = (page - 1) * limit;

    return {
        limit,
        offset
    };
}