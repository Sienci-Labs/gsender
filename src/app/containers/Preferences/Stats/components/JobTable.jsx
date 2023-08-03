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

import Icon from '@mdi/react';
import { mdiCheckBold, mdiClose } from '@mdi/js';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Table as BTable } from 'react-bootstrap';
import styles from './index.css';
import { GRBL, JOB_STATUS, JOB_TYPES } from '../../../../constants';

const JobTable = (data) => {
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
        // columnHelper.accessor((row) => `${row.id}`, {
        //     id: 'id',
        //     header: () => 'ID',
        //     cell: (info) => <i>{info.getValue()}</i>,
        //     filterFn: 'fuzzy',
        //     sortingFn: fuzzySort,
        //     size: 5,
        // }),
        // columnHelper.accessor('type', {
        //     header: () => 'Type',
        //     size: 10,
        // }),
        columnHelper.accessor('file', {
            filterFn: 'fuzzy',
            sortingFn: fuzzySort,
            header: () => 'File Name',
            // size: 100,
        }),
        // columnHelper.accessor('totalLines', {
        //     header: () => 'No. Lines in File',
        //     size: 10,
        // }),
        // columnHelper.accessor('port', {
        //     header: () => 'Port',
        //     size: 50,
        // }),
        // columnHelper.accessor('controller', {
        //     header: () => 'Controller',
        //     size: 10,
        // }),
        columnHelper.accessor('startTime', {
            header: () => 'Start Time',
            cell: (info) => {
                console.log(info.renderValue());
                return info.renderValue()?.toString();
            },
            // size: 80,
        }),
        // columnHelper.accessor('endTime', {
        //     header: () => 'End Time',
        //     cell: (info) => info.renderValue()?.toString(),
        //     size: 50,
        // }),
        columnHelper.accessor('jobStatus', {
            header: () => 'Status',
            cell: (info) => {
                return info.renderValue() === JOB_STATUS.COMPLETE ? <Icon path={mdiCheckBold} size={1} /> : <Icon path={mdiClose} size={1} />;
            },
            size: 27,
        }),
    ];

    // table variable
    const table = useReactTable({
        data: data.props || defaultData,
        columns: columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 5,
                pageIndex: 0,
            },
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
        <div className="container flex flex-col items-center justify-center gap-3 px-4 py-16 " style={{ maxWidth: '740px' }}>
            {/*** PAGINATION ***/}
            {/* buttons */}
            <div className="flex items-center gap-2">
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
            <div style={{ height: '250px' }}>
                <BTable striped bordered hover responsive size="sm" style={{ tableLayout: 'fixed' }}>
                    <thead>
                        {table.getHeaderGroups().map(
                            (
                                headerGroup // we currently only have 1 group
                            ) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            style={{
                                                width: header.getSize(),
                                                whiteSpace: 'unset'
                                            }}
                                        >
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
                                    <td key={cell.id} style={{ whiteSpace: 'unset', overflowWrap: 'break-word' }}>
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
            </div>
            <div className={styles.navContainer}>
                <div>
                    <button
                        className="rounded border p-1"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        display={currentPage > 1 ? 'block' : 'hidden'}
                    >
                        {'<<'}
                    </button>
                    <button
                        className="rounded border p-1"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        display={currentPage > 1 ? 'block' : 'hidden'}
                    >
                        {'<'}
                    </button>
                    <button
                        className="rounded border p-1"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        display={currentPage < maxPages ? 'block' : 'hidden'}
                    >
                        {'>'}
                    </button>
                    <button
                        className="rounded border p-1"
                        onClick={() => table.setPageIndex(maxPages - 1)}
                        disabled={!table.getCanNextPage()}
                        display={currentPage < maxPages ? 'block' : 'hidden'}
                    >
                        {'>>'}
                    </button>
                </div>
                {/* label */}
                <div style={{ float: 'left' }}>
                    <span
                        className="flex items-center gap-1"
                    >
                        {'Page '}
                        <strong>
                            {currentPage} of {maxPages}
                        </strong>
                    </span>
                </div>
                {/* jump to page */}
                <div style={{ float: 'left', clear: 'both' }}>
                    <span
                        className="flex items-center gap-1"
                    >
                        {'Go to page: '}
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
                </div>
            </div>
        </div>
    );
};

export default JobTable;
