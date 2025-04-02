import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    ColumnDef,
    FilterFn,
    VisibilityState,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';
import React, { useState } from 'react';
import { Table as BTable } from 'react-bootstrap';
import styles from './index.module.styl';
import { FaPlus } from 'react-icons/fa';
import cx from 'classnames';

/*
    Columns must be in the format:
        [
            {
                accessorKey: 'insert whatever key you want here',
            },
        ]
    The documentation for this package is kind of confusing for the new v8, so I'll list the rest of the options I've used here:
        header/footer
            - params: none
            - return value: the header/footer for the column
        cell
            - params: info
            - return value: what goes in the cell
        size/minSize/maxSize
            - value: number
            - determines the size of the column
        invertSorting
            - value: boolean
            - default: false
            - inverts the default sorting for the column
        enableSorting
            - value: boolean
            - default: true
            - changes whether the user is allowed to click on the header to sort the column
        filterFn
            - value: function or key of predetermined functions
            - the function used to filter the entries in the table
            - (i just use 'fuzzy' every time)
        sortingFn
            - value: function
            - the function used to sort the rows in the column
            - (you can import sortingFns from '@tanstack/react-table' to use premade ones)
    I also have a custom property:
        disableColSpan
            - value: boolean
            - if this is enabled, the column span of the previous columns will stop at this column
                - ex. if you want the subrow to only span 2 columns, you can add disableColSpan to column 3
                        |--------|--------|----|
                        |Part    |Time    |Edit|
                        |-----------------|----|
                        |this is a subrow |    |
                        |-----------------|----|
                      this can set you up to do other cool things, like making column 3 span 2 rows using rowSpan!
                        |--------|--------|----|
                        |Part    |Time    |Edit|
                        |-----------------|    |
                        |this is a subrow |    |
                        |-----------------|----|
*/

interface CustomDefOptions {
    disableColSpan?: boolean;
}

export type CustomColumnDef<
    TData extends { subRow?: string }, // this is... not the best, but the way I implemented subrows originally makes this very gross in typescript
    // we're not using subrows currently so I'm keeping it like this and leaving it's improvement as TODO
    TValue,
> = ColumnDef<TData, TValue> & CustomDefOptions;

interface SortableTableProps<TData extends { subRow?: string }, TValue> {
    defaultData?: TData[];
    height?: string;
    width?: string;
    columns?: CustomColumnDef<TData, TValue>[];
    data: TData[];
    enableSortingRemoval?: boolean;
    rowColours?: string[];
    onAdd?: () => void;
    sortBy?: {
        id: string;
        desc: boolean;
    }[];
    rowSpan?: Map<any, any>;
    pagination?: boolean;
    searchPlaceholder?: string;
    columnVisibility?: VisibilityState;
}
const SortableTable = <TData extends { subRow?: string }, TValue>(
    props: SortableTableProps<TData, TValue>,
) => {
    // set defaults
    const data = props.data || []; // array of data objects
    const columns = props.columns; // format above
    const defaultData = props.defaultData || []; // same as data
    const height = props.height || '520px';
    const width = props.width || '760px';
    const enableSortingRemoval =
        props.enableSortingRemoval !== undefined
            ? props.enableSortingRemoval
            : true;
    const searchPlaceholder =
        props.searchPlaceholder || 'Search all columns...';
    const columnVisibility = props.columnVisibility || {};
    /*
        const sortBy = [
            {
                id: 'time', // accessorKey
                desc: true
            }
        ];
    */
    const sortBy = props.sortBy || null;
    const onAdd = props.onAdd || null; // function for when add button is pressed
    const rowSpan = props.rowSpan || new Map(); // map: accessorKey => num rows to span
    const pagination =
        props.pagination !== null && props.pagination !== undefined
            ? props.pagination
            : true; // boolean for having pagination. default is true

    // stop col span from first col that has it disabled
    let stopIndex = 0;
    columns.forEach((col, i) => {
        if (col.disableColSpan) {
            stopIndex = i;
        }
    });

    const colSpanLength = stopIndex;

    /***** FUNCTIONS *****/
    const fuzzyFilter: FilterFn<TData> = (row, columnId, value, addMeta) => {
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

    /***** CONSTANTS *****/
    const [pageNum, setPageNum] = useState(1);
    const [globalFilter, setGlobalFilter] = useState('');
    const [globalSearchText, setGlobalSearchText] = useState('');
    const [sorting, setSorting] = useState(sortBy);

    /***** TABLE DATA *****/
    // table variable
    const table = useReactTable({
        data: data || defaultData,
        columns: columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            globalFilter,
            sorting,
        },
        initialState: {
            columnVisibility: columnVisibility,
            pagination: pagination
                ? {
                      pageSize: 15,
                      pageIndex: 0,
                  }
                : null,
        },
        onSortingChange: setSorting,
        enableSortingRemoval: enableSortingRemoval,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: pagination ? getPaginationRowModel() : null,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString', // this gives a lot more targetted results than the fuzzy filter
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
    });

    const currentPage = table.getState().pagination.pageIndex + 1;
    const maxPages = table.getPageCount();

    /***** RENDERING *****/
    return (
        <div className="w-full flex flex-grow flex-col items-center justify-center gap-3">
            {/*** PAGINATION ***/}
            {/*** GLOBAL SEARCH ***/}
            <div
                className={[
                    'flex items-center gap-2',
                    styles.navContainer,
                ].join(' ')}
                style={{ marginBottom: '5px' }}
            >
                <input
                    value={globalSearchText ?? ''}
                    onChange={(e) => {
                        setGlobalSearchText(e.target.value);
                        setGlobalFilter(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setGlobalFilter(globalSearchText);
                        }
                    }}
                    className="font-lg border-block border p-2 shadow  dark:text-white dark:bg-dark dark:border-dark-lighter"
                    placeholder={searchPlaceholder}
                />
                {onAdd && (
                    <div
                        className="flex items-center gap-1"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            float: 'right',
                        }}
                    >
                        <button
                            title="Add New"
                            onClick={onAdd}
                            className="gap-2 text-green-500 border border-green-500 hover:bg-green-700 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2"
                        >
                            <FaPlus />
                            Add New Task
                        </button>
                    </div>
                )}
            </div>
            {/*** TABLE ***/}
            <div
                className={cx(
                    'w-full flex flex-grow flex-col items-center justify-center gap-3',
                    {
                        hidden: table.getRowModel().rows.length <= 0, // hide table if no search results
                    },
                )}
            >
                <div
                    style={{
                        maxHeight: height,
                        minHeight: height,
                        maxWidth: width,
                        minWidth: width,
                        marginBottom: '5px',
                        overflowY: 'scroll',
                    }}
                >
                    <BTable
                        striped
                        bordered
                        responsive
                        hover
                        className="min-w-full leading-normal"
                    >
                        <thead>
                            {table.getHeaderGroups().map(
                                (
                                    headerGroup, // we currently only have 1 group
                                ) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-white dark:bg-dark-lighter"
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <>
                                                        <div
                                                            {...{
                                                                className:
                                                                    header.column.getCanSort()
                                                                        ? 'cursor-pointer select-none'
                                                                        : '',
                                                                onClick:
                                                                    header.column.getToggleSortingHandler(),
                                                            }}
                                                        >
                                                            {flexRender(
                                                                header.column
                                                                    .columnDef
                                                                    .header,
                                                                header.getContext(),
                                                            )}
                                                            {{
                                                                asc: ' 🔼',
                                                                desc: ' 🔽',
                                                            }[
                                                                header.column
                                                                    .getIsSorted()
                                                                    .toString()
                                                            ] ?? null}
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ),
                            )}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row, _i) => {
                                return (
                                    <React.Fragment key={row.id + 'parent'}>
                                        <tr
                                            key={row.id}
                                            className="odd:bg-gray-50 even:bg-white dark:odd:bg-dark dark:even:bg-dark-lighter dark:text-white"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        rowSpan={
                                                            rowSpan.get(
                                                                cell.column
                                                                    .columnDef
                                                                    .id, // id has replaced accessorKey
                                                            ) || 1
                                                        }
                                                        style={{
                                                            whiteSpace: 'unset',
                                                            overflowWrap:
                                                                'break-word',
                                                            width: cell.column.getSize(),
                                                        }}
                                                        className="px-5 py-5 border border-gray-200 text-sm"
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </td>
                                                ))}
                                        </tr>
                                        {row.original.subRow && (
                                            <tr
                                                key={row.id + 'subRow'}
                                                className="odd:bg-gray-50 even:bg-white dark:odd:bg-dark dark:even:bg-dark-lighter dark:text-white"
                                            >
                                                <td
                                                    colSpan={colSpanLength}
                                                    style={{
                                                        whiteSpace: 'pre-line',
                                                        overflowWrap:
                                                            'break-word',
                                                    }}
                                                >
                                                    {row.original.subRow}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </BTable>
                </div>
                {/* buttons */}
                {pagination && (
                    <div
                        className={[
                            'flex items-center gap-2',
                            styles.navContainer,
                        ].join(' ')}
                    >
                        <button
                            className={cx(
                                'rounded border p-1 dark:text-white',
                                {
                                    block: currentPage > 1,
                                    hidden: currentPage <= 1,
                                },
                            )}
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                            // display={currentPage > 1 ? 'block' : 'hidden'}
                        >
                            {'<<'}
                        </button>
                        <button
                            className={cx(
                                'rounded border p-1 dark:text-white',
                                {
                                    block: currentPage > 1,
                                    hidden: currentPage <= 1,
                                },
                            )}
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            // display={currentPage > 1 ? 'block' : 'hidden'}
                        >
                            {'<'}
                        </button>
                        <button
                            className={cx(
                                'rounded border p-1 dark:text-white',
                                {
                                    block: currentPage < maxPages,
                                    hidden: currentPage >= maxPages,
                                },
                            )}
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            // display={currentPage < maxPages ? 'block' : 'hidden'}
                        >
                            {'>'}
                        </button>
                        <button
                            className={cx(
                                'rounded border p-1 dark:text-white',
                                {
                                    block: currentPage < maxPages,
                                    hidden: currentPage >= maxPages,
                                },
                            )}
                            onClick={() => table.setPageIndex(maxPages - 1)}
                            disabled={!table.getCanNextPage()}
                            // display={currentPage < maxPages ? 'block' : 'hidden'}
                        >
                            {'>>'}
                        </button>
                        {/* label */}
                        <span
                            className="flex items-center gap-1 dark:text-white"
                            style={{ marginLeft: '10px' }}
                        >
                            {'Page '}
                            <strong>
                                {currentPage} of {maxPages}
                            </strong>
                        </span>
                        {/* jump to page */}
                        <div
                            className="flex items-center gap-1"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                float: 'right',
                            }}
                        >
                            <span
                                style={{ marginRight: '5px' }}
                                className="dark:text-white"
                            >
                                {'Jump to page: '}
                                <input
                                    type="number"
                                    defaultValue={currentPage}
                                    onChange={(e) => {
                                        setPageNum(
                                            e.target.value
                                                ? Number(e.target.value) - 1
                                                : 0,
                                        );
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            table.setPageIndex(pageNum);
                                        }
                                    }}
                                    className={[
                                        'w-16 rounded border p-1 ',
                                        styles.input,
                                    ].join(' ')}
                                    min="1"
                                    max={maxPages}
                                    style={{ minWidth: '60px' }}
                                />
                            </span>
                            <div
                                style={{ marginRight: '5px' }}
                                className="dark:text-white"
                            >
                                |
                            </div>
                            {/*** PAGE SIZE ***/}
                            <div>
                                <span className="dark:text-white mr-1">
                                    Entries/Page:
                                </span>
                                <select
                                    value={table.getState().pagination.pageSize}
                                    onChange={(e) => {
                                        table.setPageSize(
                                            Number(e.target.value),
                                        );
                                    }}
                                >
                                    {[15, 30, 50, 75, 100].map((pageSize) => (
                                        <option key={pageSize} value={pageSize}>
                                            Show {pageSize}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SortableTable;
