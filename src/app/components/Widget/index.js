/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import { MenuItem as DropdownMenuItem } from '../Dropdown';
import Widget from './Widget';
import Header from './Header';
import Content from './Content';
import Footer from './Footer';
import Sortable from './Sortable';
import Title from './Title';
import Button from './Button';
import DropdownButton from './DropdownButton';
import Controls from './Controls';

Widget.Header = Header;
Widget.Content = Content;
Widget.Footer = Footer;
Widget.Sortable = Sortable;
Widget.Title = Title;
Widget.Button = Button;
Widget.DropdownButton = DropdownButton;
Widget.DropdownMenuItem = DropdownMenuItem;
Widget.Controls = Controls;

export default Widget;
