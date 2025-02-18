import React from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Dashboard, ShoppingCart, Inventory, Receipt } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import "./Side.css";

const StyledSidebar = styled(Sidebar)(({ theme }) => ({
    height: "100vh",
    width: "250px",
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
    boxShadow: "4px 0 10px rgba(0, 0, 0, 0.2)",
}));

const StyledMenuItem = styled(MenuItem)({
    fontSize: "18px",
    fontWeight: 500,
    padding: "15px 20px",
    borderRadius: "10px",
    margin: "0px",
    transition: "background 0.3s ease, transform 0.2s ease",
    "&:hover": {
        background: "rgba(255, 255, 255, 0.2)",
        transform: "scale(1.05)",
    },
    "&:active": {
        transform: "scale(0.95)",
    },
});

const Side = () => {
    return (
        <StyledSidebar>
            <Menu>
                <StyledMenuItem icon={<Dashboard />}>Dashboard</StyledMenuItem>
                <StyledMenuItem icon={<ShoppingCart />}>Manage Product</StyledMenuItem>
                <StyledMenuItem icon={<Inventory />}>Manage Ingredient</StyledMenuItem>
                <StyledMenuItem icon={<Receipt />}>Manage Order</StyledMenuItem>
            </Menu>
        </StyledSidebar>
    );
};

export default Side;
