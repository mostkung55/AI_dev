import React from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import "./Side.css";

const Side = () => {
    return(
        <Sidebar className="sidebar">
                <Menu className="menu">
                    <MenuItem> DashBoard </MenuItem>
                    <MenuItem> Manage Product </MenuItem>
                    <MenuItem> Manage Ingredient</MenuItem>
                    <MenuItem> Manage Order </MenuItem>
                </Menu>
            </Sidebar>
    )
}

export default Side