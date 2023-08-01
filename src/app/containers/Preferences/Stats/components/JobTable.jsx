/*
base filtering and pagination code is from examples in https://tanstack.com/table/v8
*/

import React, { useState } from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    sortingFns,
} from '@tanstack/react-table';
import { rankItem, compareItems } from '@tanstack/match-sorter-utils';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Table as BTable } from 'react-bootstrap';
import styles from './index.css';
import { GRBL, JOB_STATUS, JOB_TYPES } from '../../../../constants';

const JobTable = (data) => {
    console.log(data);
    /***** FUNCTIONS *****/
    const fuzzyFilter = (row, columnId, value, addMeta) => {
        // Rank the item
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const itemRank = rankItem(row.getValue(columnId), value);

        // Store the itemRank info
        addMeta({
            itemRank,
        });

        // Return if the item should be filtered in/out
        return itemRank.passed;
    };
    const fuzzySort = (rowA, rowB, columnId) => {
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

    /***** CONSTANTS *****/
    const [pageNum, setPageNum] = useState(1);
    const [globalFilter, setGlobalFilter] = useState('');
    const [globalSearchText, setGlobalSearchText] = useState('');

    /***** TABLE DATA *****/
    // need default data, as table does not accept null or undefined data (which the query may give back)
    const defaultData = [
        {
            id: 'default',
            type: JOB_TYPES.JOB,
            file: '',
            path: null,
            lines: 0,
            port: '',
            controller: GRBL,
            startTime: new Date(),
            endTime: null,
            jobStatus: JOB_STATUS.COMPLETE
        },
    ];

    // columns structure
    const columnHelper = createColumnHelper();
    const columns = [
        columnHelper.accessor((row) => `${row.id}`, {
            id: 'id',
            header: () => 'ID',
            cell: (info) => <i>{info.getValue()}</i>,
            filterFn: 'fuzzy',
            sortingFn: fuzzySort,
        }),
        columnHelper.accessor('type', {
            header: () => 'Type',
        }),
        columnHelper.accessor('file', {
            header: () => 'File Name',
        }),
        columnHelper.accessor('path', {
            header: () => 'File Path',
        }),
        columnHelper.accessor('lines', {
            header: () => 'No. Lines',
        }),
        columnHelper.accessor('port', {
            header: () => 'Port',
        }),
        columnHelper.accessor('controller', {
            header: () => 'Controller',
        }),
        columnHelper.accessor('startTime', {
            header: () => 'Start Time',
            cell: (info) => info.renderValue()?.toISOString(),
        }),
        columnHelper.accessor('endTime', {
            header: () => 'End Time',
            cell: (info) => info.renderValue()?.toISOString(),
        }),
        columnHelper.accessor('jobStatus', {
            header: () => 'Status',
        }),
    ];

    // table variable
    const table = useReactTable({
        data: data || defaultData,
        columns: columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            globalFilter,
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
    });

    const currentPage = table.getState().pagination.pageIndex + 1;
    const maxPages = table.getPageCount();

    /***** RENDERING *****/
    return (
        <div className="container flex flex-col items-center justify-center gap-3 px-4 py-16 ">
            {/*** PAGINATION ***/}
            {/* buttons */}
            <div className="flex items-center gap-2">
                {currentPage > 1 && (
                    <button
                        className={['rounded border p-1', styles.pagination].join(' ')}
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {'<<'}
                    </button>
                )}
                {currentPage > 1 && (
                    <button
                        className={['rounded border p-1', styles.pagination].join(' ')}
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {'<'}
                    </button>
                )}
                {currentPage < maxPages && (
                    <button
                        className={['rounded border p-1', styles.pagination].join(' ')}
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        {'>'}
                    </button>
                )}
                {currentPage < maxPages && (
                    <button
                        className={['rounded border p-1', styles.pagination].join(' ')}
                        onClick={() => table.setPageIndex(maxPages - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        {'>>'}
                    </button>
                )}
                {/* label */}
                <span
                    className={['flex items-center gap-1 ', styles.pagination].join(' ')}
                >
                    <div>Page</div>
                    <strong>
                        {currentPage} of {maxPages}
                    </strong>
                </span>
                {/* jump to page */}
                <span
                    className={['flex items-center gap-1 ', styles.pagination].join(' ')}
                >
                    | Go to page:
                    <input
                        type="number"
                        defaultValue={currentPage}
                        onChange={(e) => {
                            setPageNum(e.target.value ? Number(e.target.value) - 1 : 0);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                table.setPageIndex(pageNum);
                            }
                        }}
                        className={['w-16 rounded border p-1 ', styles.input].join(' ')}
                        min="1"
                        max={maxPages}
                    />
                </span>
                {/*** PAGE SIZE ***/}
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                        table.setPageSize(Number(e.target.value));
                    }}
                >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
            {/*** GLOBAL SEARCH ***/}
            <div>
                <input
                    value={globalSearchText ?? ''}
                    onChange={(e) => {
                        setGlobalSearchText(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setGlobalFilter(globalSearchText);
                        }
                    }}
                    className="font-lg border-block border p-2 shadow"
                    placeholder="Search all columns..."
                />
            </div>
            {/*** TABLE ***/}
            <BTable striped bordered hover responsive size="sm">
                <thead>
                    {table.getHeaderGroups().map(
                        (
                            headerGroup // we currently only have 1 group
                        ) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id}>
                                        {header.isPlaceholder ? null : (
                                            <>
                                                <div
                                                    {...{
                                                        className: header.column.getCanSort()
                                                            ? 'cursor-pointer select-none'
                                                            : '',
                                                        onClick: header.column.getToggleSortingHandler(),
                                                    }}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {{
                                                        asc: ' 🔼',
                                                        desc: ' 🔽',
                                                    }[header.column.getIsSorted().toString()] ?? null}
                                                </div>
                                            </>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        )
                    )}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    {table.getFooterGroups().map((footerGroup) => (
                        <tr key={footerGroup.id}>
                            {footerGroup.headers.map((header) => (
                                <th key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.footer,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </tfoot>
            </BTable>
            <div className="h-4" />
        </div>
    );
};

export default JobTable;
