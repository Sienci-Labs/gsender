import React from 'react';
import {
    createColumnHelper,
    sortingFns,
} from '@tanstack/react-table';
import { compareItems } from '@tanstack/match-sorter-utils';

export const fuzzySort = (rowA, rowB, columnId) => {
    let dir = 0;

    // Only sort by rank if the column has ranking information
    if (rowA.columnFiltersMeta[columnId]) {
        dir = compareItems(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            rowA.columnFiltersMeta[columnId]?.itemRank,
            rowB.columnFiltersMeta[columnId]?.itemRank
        );
    }

    // Provide an alphanumeric fallback for when the item ranks are equal
    return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

export const createTableColumns = (columnData) => {
    const columnHelper = createColumnHelper();
    const columns = columnData.map((obj) => {
        const helper = columnHelper.accessor(obj.name, {
            header: obj.header || function() {
                return 'Header';
            },
            cell: obj.cell || function(props) {
                return <span>{props.getValue()}</span>;
            },
        });
        // the defaults for these values are auto generated and different than the "auto" option,
        // so only include them if they are defined
        if (obj.minSize) {
            helper.minSize = obj.minSize;
        }
        if (obj.maxSize) {
            helper.maxSize = obj.maxSize;
        }
        return helper;
    });
    columns[0].filterFn = 'fuzzy';
    columns[0].sortingFn = fuzzySort;
    return columns;
};
