import React, { useState, useEffect } from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Dashboard, ShoppingCart, Inventory, Receipt } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { IconButton } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material"; 
import { useNavigate } from "react-router-dom"; 
import "./Side.css";



const StyledSidebar = styled(Sidebar)(({ theme }) => ({
    height: "115vh",
    width: "250px",
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
    boxShadow: "4px 0 10px rgba(0, 0, 0, 0.2)",
}));

const StyledMenuItem = styled(MenuItem)({
    fontSize: "20px",
    fontWeight: 500,
    padding: "10px",
    borderRadius: "10px",
    marginTop: "40px",
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
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setCollapsed(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleMenuClick = (path) => {
        navigate(path);
        if (window.innerWidth < 768) {
            setCollapsed(true);
        }
    };

    return (
        <StyledSidebar collapsed={collapsed}>
            {/* ปุ่มเปิด-ปิด Sidebar */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px" }}>
                <IconButton onClick={() => setCollapsed(!collapsed)} style={{ color: "#fff" }}>
                    <MenuIcon />
                </IconButton>
            </div>

           
            <Menu>
            <StyledMenuItem onClick={() => handleMenuClick("/")}>
                    <Dashboard style={{ verticalAlign: "middle", marginRight: "10px" }} />
                    Dashboard
                </StyledMenuItem>
                <StyledMenuItem onClick={() => handleMenuClick("/Product")}>
                    <ShoppingCart style={{ verticalAlign: "middle", marginRight: "10px" }} />
                    Manage Product
                </StyledMenuItem>
                <StyledMenuItem onClick={() => handleMenuClick("/Ingre")}>
                    <Inventory style={{ verticalAlign: "middle", marginRight: "10px" }} />
                    Manage Ingredient
                </StyledMenuItem>
                <StyledMenuItem onClick={() => handleMenuClick("/Order")}>
                    <Receipt style={{ verticalAlign: "middle", marginRight: "10px" }} />
                    Manage Order
                </StyledMenuItem>
            </Menu>
        </StyledSidebar>
    );
};

export default Side;
