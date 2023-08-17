/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React, { useMemo } from 'react';
import {
    sortingFns,
} from '@tanstack/react-table';
import Icon from '@mdi/react';
import { mdiAlert } from '@mdi/js';
import styles from '../index.styl';
import { SortableTable } from '../../../components/SortableTable';

const Maintenance = () => {
    const data = [
        {
            id: 0,
            part: 'Rails & Wheels',
            time: 'Due',
            subRow:
                'hiiiiiiiiiiiiiii'
        },
        {
            id: 1,
            part: 'Rails & Wheels',
            time: 3,
            subRow:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam consequat posuere lectus vitae consectetur. Fusce et orci a justo fringilla cursus in eget mi. Aenean eget ante viverra nibh pulvinar ultrices. Nam finibus faucibus massa eu congue. Fusce posuere, felis dignissim venenatis vehicula, velit purus efficitur elit, et facilisis nulla eros quis elit. Pellentesque sit amet tortor purus. Proin et risus ex.' +
                'Donec ut urna augue. Donec ac eros a velit placerat fermentum. Nam varius lorem turpis, ac fringilla purus ornare id. Duis consectetur velit eget facilisis egestas. Nulla non imperdiet libero, sit amet condimentum lacus. Nullam sodales metus eu felis accumsan, sit amet consequat sapien molestie. Phasellus volutpat euismod sem non faucibus. Cras eget feugiat tortor. In turpis urna, pharetra sed erat a, tincidunt tristique enim. Vivamus nec tellus consequat, auctor mi quis, dictum tortor. Mauris sodales erat a urna sagittis convallis. Vestibulum semper velit et augue rhoncus rutrum. Integer ultricies venenatis lacus, et placerat libero vestibulum non. Donec rutrum ipsum eget nibh mollis, quis dignissim velit volutpat. Aenean consequat pellentesque purus eu mattis.' +
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a pellentesque purus. Sed non nisl vitae felis ultricies hendrerit imperdiet non ante. Vivamus consequat sagittis velit at iaculis. Nulla sed dolor elementum, elementum purus in, volutpat sapien. Suspendisse eu purus ut velit pellentesque commodo at ac dui. Ut convallis eros sit amet leo fringilla, ac viverra orci aliquet. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin congue iaculis orci. Sed vulputate lacinia leo sed efficitur. Curabitur finibus elementum sem, id tincidunt ipsum varius eu. Curabitur pretium, nulla et mattis interdum, lacus nulla tempor augue, et rutrum ex arcu et urna. Aliquam egestas faucibus sapien a sodales. Mauris condimentum augue eu metus eleifend, eu vulputate augue facilisis' +
                'Proin metus velit, condimentum dictum laoreet id, volutpat vel lorem. Ut tristique ultricies quam in sagittis. Donec semper nunc vitae sapien convallis, nec commodo nibh condimentum. Donec imperdiet eros id est ullamcorper efficitur. Maecenas sed luctus arcu. Cras facilisis, turpis sodales dignissim vehicula, felis diam efficitur leo, ut mollis neque justo ut tortor. Donec tempus nec tortor eu consequat. Nulla aliquam lorem magna, eget porta tortor finibus et.' +
                'Fusce lobortis ante quis pharetra suscipit. Donec porttitor ante sem, sit amet blandit ligula auctor et. Morbi blandit quis lorem sed ullamcorper. Donec aliquam nunc sed ornare lobortis. Mauris mauris erat, venenatis eget iaculis vitae, varius quis urna. Quisque vel velit eu urna iaculis varius suscipit pharetra eros. Pellentesque dignissim felis urna, eget facilisis arcu pulvinar eget. Donec arcu ante, gravida id interdum a, ultricies at felis. Sed consectetur blandit sollicitudin. Nullam tristique massa eget hendrerit tincidunt. Donec luctus felis laoreet ipsum scelerisque commodo. Nulla id efficitur odio, in facilisis urna.'
        },
        {
            id: 2,
            part: 'Linear smth',
            time: <div><Icon path={mdiAlert} size={1} />{' Urgent!'}</div>,
            subRow:
                'this is a description'
        },
        {
            id: 3,
            part: 'Linear smth',
            time: 5,
            subRow:
                'this is a description'
        }
    ];
    const columns = useMemo(
        () => [
            {
                accessorKey: 'part',
                header: () => 'Part',
                enableSorting: false,
            },
            {
                accessorKey: 'time',
                header: () => 'Time Until Next Maintenance',
                cell: (info) => {
                    if (Number(info.renderValue())) {
                        return <div style={{ color: 'green' }}>{info.renderValue() + ' Hours'}</div>;
                    } else if (info.renderValue() === 'Due') {
                        return <span style={{ color: '#E15C00', fontStyle: 'bold' }}>{info.renderValue()}</span>;
                    } else {
                        return <div style={{ color: 'red' }}>{info.renderValue()}</div>;
                    }
                },
                minSize: 90,
                maxSize: 90,
                invertSorting: true,
                filterFn: 'fuzzy',
                sortingFn: sortingFns.alphanumeric
            },
        ]
    );
    const sortBy = [
        {
            id: 'time',
            desc: true
        }
    ];

    return (
        <div className={[styles.addMargin].join(' ')}>
            <SortableTable data={data} columns={columns} enableSortingRemoval={false} sortBy={sortBy} />
        </div>
    );
};

export default Maintenance;
