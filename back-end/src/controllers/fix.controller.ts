import { Request, Response } from "express";
import { getPool } from "../config/db";

// ── Menu structure definition ──────────────────────────────────────────────
// This seeds the DB with the full Masters / Entries hierarchy.
//
// Masters
//   ├─ Admin Master  →  Roles, Users, Main Menu, Sub Menu, Links & Pages
//   ├─ Geography     →  Countries, Regions, Districts
//   └─ Financial     →  Currency, UOM
// Entries  (empty for now)
// ──────────────────────────────────────────────────────────────────────────

const MENU_STRUCTURE = [
  {
    name: "Masters",
    seq: 1,
    icon: "Layers",
    subMenus: [
      {
        name: "Admin Master",
        seq: 1,
        icon: "ShieldCheck",
        links: [
          { name: "Roles",        route: "/roles",            icon: "Shield",    seq: 1 },
          { name: "Users",        route: "/users",            icon: "Users",     seq: 2 },
          { name: "Main Menu",    route: "/main-menu",        icon: "LayoutList",seq: 3 },
          { name: "Sub Menu",     route: "/sub-menu",         icon: "LayoutList",seq: 4 },
          { name: "Links & Pages",route: "/links-and-pages",  icon: "Link2",     seq: 5 },
          { name: "Role Links",   route: "/role-to-link",     icon: "ShieldCheck",seq: 6 },
        ],
      },
      {
        name: "Organization",
        seq: 2,
        icon: "Globe",
        links: [
          { name: "Company Master", route: "/company-master",  icon: "Building2",     seq: 1 },
          { name: "Camp Master",    route: "/camp-master",     icon: "Tent",          seq: 2 },
          { name: "Department Master", route: "/department-master", icon: "Building2", seq: 3 },
          { name: "Designation Master", route: "/designation-master", icon: "Briefcase", seq: 4 },
          { name: "Department Group Master", route: "/department-group-master", icon: "Users", seq: 5 },
          { name: "Designation Group Master", route: "/designation-group-master", icon: "Users", seq: 6 },
          { name: "Company Dept-Designation Mapping", route: "/company-department-designation-mapping", icon: "Network", seq: 7 },
          { name: "Cost Centre Master", route: "/cost-centre-master", icon: "Calculator", seq: 8 },
          { name: "Store Master", route: "/store-master", icon: "Store", seq: 9 },
          { name: "Store Product Minimum Stock", route: "/store-product-minimum-stock", icon: "Warehouse", seq: 10 },
          { name: "User Store Mapping", route: "/user-store-mapping", icon: "MapPin", seq: 11 },
          { name: "Business Partner Master", route: "/business-partner-master", icon: "Handshake", seq: 12 },
          { name: "Bank Master", route: "/bank-master", icon: "Landmark", seq: 13 },
          { name: "Company Bank Account Master", route: "/company-bank-account-master", icon: "PiggyBank", seq: 14 },
          { name: "Location Master", route: "/location-master", icon: "Map", seq: 15 },
          { name: "Blood Group Master", route: "/blood-group-master", icon: "Droplet", seq: 16 },
          { name: "Field Master", route: "/field", icon: "LayoutGrid", seq: 17 },
        ],
      },
      {
        name: "HR & Payroll",
        seq: 3,
        icon: "UsersRound",
        links: [
          { name: "Employment Type Master", route: "/employment-type-master", icon: "Briefcase", seq: 1 },
          { name: "Education Qualification Master", route: "/education-qualification-master", icon: "GraduationCap", seq: 2 },
          { name: "Employee Contract Type Master", route: "/employee-contract-type-master", icon: "FileCheck", seq: 3 },
          { name: "Employee Working Status Master", route: "/employee-working-status-master", icon: "BadgeCheck", seq: 4 },
          { name: "Visa Type Master", route: "/visa-type-master", icon: "Passport", seq: 5 },
          { name: "License Permit Type", route: "/license-permit-type", icon: "FileBadge", seq: 6 },
          { name: "License Permit Cost", route: "/license-permit-cost", icon: "DollarSign", seq: 7 },
          { name: "Permit Authority Master", route: "/permit-authority-master", icon: "Landmark", seq: 14 },
          { name: "New Salary Scale", route: "/new-salary-scale", icon: "Banknote", seq: 8 },
          { name: "Man Power Change Request", route: "/man-power-change-request", icon: "Users", seq: 9 },
          { name: "Man Power Approved Settings", route: "/man-power-approved-settings", icon: "Users", seq: 10 },
          { name: "Attendance Type Master", route: "/attendance-type-master", icon: "CalendarCheck", seq: 11 },
          { name: "Attendance Request", route: "/attendance-request", icon: "CalendarCheck", seq: 12 },
          { name: "Cash Advance Request", route: "/cash-advance-request", icon: "Wallet", seq: 13 },
        ],
      },
      {
        name: "Fleet & Logistics",
        seq: 4,
        icon: "Truck",
        links: [
          { name: "Trailer Type Master", route: "/trailer-type-master", icon: "Truck", seq: 1 },
          { name: "Trailer Master", route: "/trailer-master", icon: "Truck", seq: 2 },
          { name: "Truck Type Master", route: "/truck-type-master", icon: "Truck", seq: 3 },
          { name: "Fuel Station Master", route: "/fuel-station-master", icon: "Fuel", seq: 4 },
          { name: "Bus Boarding Location Master", route: "/bus-boarding-location-master", icon: "Bus", seq: 5 },
          { name: "Trip Template Master", route: "/trip-template-master", icon: "Route", seq: 6 },
          { name: "Airport Master", route: "/airport-master", icon: "Plane", seq: 7 },
          { name: "Airlines Master", route: "/airlines-master", icon: "Plane", seq: 8 },
          { name: "Truck Master", route: "/truck-master", icon: "Truck", seq: 15 },
          { name: "Driver Master", route: "/driver-master", icon: "User", seq: 16 },
          { name: "Driver Truck Master Mapping", route: "/driver-truck-master-mapping", icon: "Network", seq: 17 },
          { name: "Fuel Type Master", route: "/fuel-type-master", icon: "Fuel", seq: 18 },
          { name: "Trip Template Price Mapping", route: "/trip-template-price-mapping", icon: "Route", seq: 19 },
          { name: "Customer Wise Trip Template Price Mapping", route: "/customer-wise-trip-template-price-mapping", icon: "Route", seq: 20 },
        ],
      },
      {
        name: "Financial",
        seq: 5,
        icon: "Banknote",
        links: [
          { name: "Currency", route: "/currency-master", icon: "Banknote", seq: 1 },
          { name: "UOM", route: "/uom-master", icon: "Scale", seq: 2 },
          { name: "Exchange Rate Master", route: "/exchange-rate-master", icon: "ArrowLeftRight", seq: 3 },
          { name: "Payment Mode Master", route: "/payment-mode-master", icon: "CreditCard", seq: 4 },
          { name: "Payment Trigger Event Master", route: "/payment-trigger-event-master", icon: "Zap", seq: 5 },
          { name: "Payment Term Master", route: "/payment-term-master", icon: "CalendarClock", seq: 6 },
          { name: "Credit Limit Payment Mode Master", route: "/credit-limit-payment-mode-master", icon: "CreditCard", seq: 7 },
          { name: "Customer Credit Limit Details", route: "/customer-credit-limit-details", icon: "ShieldCheck", seq: 8 },
          { name: "VAT Percentage Setting", route: "/vat-percentage-setting", icon: "Percent", seq: 9 },
          { name: "BP Product VAT Percentage Settings", route: "/bp-product-vat-percentage-settings", icon: "Percent", seq: 15 },
          { name: "Price Type Master", route: "/price-type-master", icon: "Tag", seq: 10 },
          { name: "Price Package Master", route: "/price-package-master", icon: "Package", seq: 11 },
          { name: "Price List Master", route: "/price-list-master", icon: "List", seq: 12 },
          { name: "Sales Type Master", route: "/sales-type-master", icon: "ShoppingCart", seq: 13 },
          { name: "Sales Package Type Master", route: "/sales-package-type-master", icon: "Package", seq: 14 },
          { name: "Client Additional Services Master", route: "/client-additional-services-master", icon: "Wrench", seq: 16 },
        ],
      },
      {
        name: "Product & Stock",
        seq: 6,
        icon: "Boxes",
        links: [
          { name: "Product Main Category", route: "/product-main-category", icon: "Boxes", seq: 1 },
          { name: "Product Sub Category", route: "/product-sub-category", icon: "Box", seq: 2 },
          { name: "Product Master", route: "/product-master", icon: "Package", seq: 3 },
          { name: "Product Company Main Category Mapping", route: "/product-company-main-category-mapping", icon: "Network", seq: 4 },
          { name: "Product Opening Stock", route: "/product-opening-stock", icon: "ClipboardList", seq: 5 },
          { name: "Rack Section Master", route: "/rack-section-master", icon: "Columns3", seq: 6 },
          { name: "Rack Master", route: "/rack-master", icon: "LayoutGrid", seq: 7 },
        ],
      },
      {
        name: "Wildlife & Ammunition",
        seq: 7,
        icon: "Crosshair",
        links: [
          { name: "Animal Master", route: "/animal-master", icon: "PawPrint", seq: 1 },
          { name: "Animal Parts Master", route: "/animal-parts-master", icon: "Bone", seq: 2 },
          { name: "Professional Hunter Master", route: "/professional-hunter-master", icon: "Crosshair", seq: 3 },
          { name: "Anti Poaching Findings Master", route: "/anti-poaching-findings-master", icon: "ShieldAlert", seq: 4 },
          { name: "Gun Type Master", route: "/gun-type-master", icon: "Crosshair", seq: 5 },
          { name: "Gun Category Master", route: "/gun-category-master", icon: "Layers", seq: 6 },
          { name: "Gun Brand Master", route: "/gun-brand-master", icon: "Factory", seq: 7 },
          { name: "Gun Master", route: "/gun-master", icon: "Crosshair", seq: 8 },
          { name: "Bullet Type Master", route: "/bullet-type-master", icon: "CircleDot", seq: 9 },
          { name: "Bullet Master", route: "/bullet-master", icon: "Circle", seq: 10 },
          { name: "Caliber Master", route: "/caliber-master", icon: "Ruler", seq: 11 },
          { name: "Ammunition Brand Master", route: "/ammunition-brand-master", icon: "Factory", seq: 12 },
          { name: "Hotel Resort Master", route: "/hotel-resort-master", icon: "Hotel", seq: 13 },
          { name: "Videographer Master", route: "/videographer-master", icon: "Video", seq: 14 },
          { name: "Massager Master", route: "/massager-master", icon: "Sparkles", seq: 15 },
          { name: "Company Quota Animal Mapping", route: "/company-quota-animal-mapping", icon: "Crosshair", seq: 16 },
          { name: "Animal Hunting Charges Master", route: "/animal-hunting-charges-master", icon: "PawPrint", seq: 17 },
        ],
      },
      {
        name: "Geography",
        seq: 8,
        icon: "Globe",
        links: [
          { name: "Countries", route: "/country-master",  icon: "Globe",     seq: 1 },
          { name: "Regions",   route: "/region-master",   icon: "MapPinned", seq: 2 },
          { name: "Districts", route: "/district-master", icon: "MapPin",    seq: 3 },
        ],
      },
    ],
  },
  {
    name: "Entries",
    seq: 2,
    icon: "FileText",
    subMenus: [
      {
        name: "Payroll Entries",
        seq: 1,
        icon: "CalendarClock",
        links: [
          { name: "Holidays", route: "/holidays", icon: "CalendarDays", seq: 1 },
          { name: "Employee Database", route: "/employee-database", icon: "Users", seq: 2 },
          { name: "Attendance Details", route: "/attendance-details", icon: "CalendarCheck", seq: 3 },
          { name: "Arrear Entry", route: "/arrear-entries", icon: "TrendingUp", seq: 4 },
          { name: "Bonus Entry", route: "/bonus-entries", icon: "Gift", seq: 5 },
          { name: "Deduction Entry", route: "/deduction-entries", icon: "BadgeMinus", seq: 6 },
          { name: "Overtime Entry", route: "/overtime-entries", icon: "Clock", seq: 7 },
          { name: "Overtime Reference Entry", route: "/overtime-reference-entries", icon: "Clock3", seq: 8 },
          { name: "Leave Encashment Entry", route: "/leave-encashment-entries", icon: "Wallet", seq: 9 },
          { name: "Labor Charge Entry", route: "/labor-charge-entries", icon: "Hammer", seq: 10 },
          { name: "Promotion/Demotion/Transfer Entry", route: "/promotion-demotion-transfer-entries", icon: "ArrowUpDown", seq: 11 },
          { name: "Monthly Auto Deduction", route: "/monthly-auto-deduction", icon: "Repeat", seq: 12 },
          { name: "Employee Daily Shift Details", route: "/employee-daily-shift-details", icon: "CalendarClock", seq: 13 },
        ],
      },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

async function clearMenuData(pool: any) {
  // Order matters: FK constraints require deleting child rows first
  await pool.request().query("DELETE FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE");
  await pool.request().query("DELETE FROM VMaster.TBL_LINKS_AND_PAGES");
  await pool.request().query("DELETE FROM VMaster.TBL_SUB_MENU");
  await pool.request().query("DELETE FROM VMaster.TBL_MAIN_MENU");
}

async function getOrCreateAdminRole(pool: any): Promise<number> {
  let res = await pool
    .request()
    .query("SELECT ROLE_ID FROM VMaster.TBL_ROLE_MASTER WHERE ROLE_NAME = 'Admin'");

  if (res.recordset.length === 0) {
    await pool.request().query(`
      INSERT INTO VMaster.TBL_ROLE_MASTER
        (ROLE_NAME, ROLE_DESCRIPTION, STATUS_MASTER, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
      VALUES ('Admin', 'System Administrator', 'AC', 'System', GETDATE(), 'System', GETDATE())
    `);
    res = await pool
      .request()
      .query("SELECT ROLE_ID FROM VMaster.TBL_ROLE_MASTER WHERE ROLE_NAME = 'Admin'");
  }
  return Number(res.recordset[0].ROLE_ID);
}

// ── Seed ───────────────────────────────────────────────────────────────────

async function seedMenus(pool: any, roleId: number) {
  const results: any[] = [];

  for (const mainMenu of MENU_STRUCTURE) {
    // ── Insert Main Menu ──────────────────────────────────────────────────
    await pool.request().query(`
      INSERT INTO VMaster.TBL_MAIN_MENU
        (MAIN_MENU_NAME, MAIN_MENU_SEQ_ID, STATUS_MASTER, STYLE_CSS, PAGE_ACTION,
         CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
      VALUES
        ('${mainMenu.name}', ${mainMenu.seq}, 'AC', '${mainMenu.icon}', '',
         'System', GETDATE(), 'System', GETDATE())
    `);

    const mmRow = await pool.request().query(
      `SELECT MAIN_MENU_ID FROM VMaster.TBL_MAIN_MENU WHERE MAIN_MENU_NAME = '${mainMenu.name}'`
    );
    const mmId = Number(mmRow.recordset[0].MAIN_MENU_ID);

    // ── Insert Sub Menus ──────────────────────────────────────────────────
    for (const sub of mainMenu.subMenus) {
      await pool.request().query(`
        INSERT INTO VMaster.TBL_SUB_MENU
          (MAIN_MENU_ID, SUB_MENU_NAME, SUB_MENU_SEQ_ID, STATUS_MASTER, STYLE_CSS,
           PAGE_ACTION, IS_PARENT, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
        VALUES
          (${mmId}, '${sub.name}', ${sub.seq}, 'AC', '${sub.icon}',
           '', 'Y', 'System', GETDATE(), 'System', GETDATE())
      `);

      const smRow = await pool.request().query(
        `SELECT SUB_MENU_ID FROM VMaster.TBL_SUB_MENU WHERE SUB_MENU_NAME = '${sub.name}' AND MAIN_MENU_ID = ${mmId}`
      );
      const smId = Number(smRow.recordset[0].SUB_MENU_ID);

      // ── Insert Links & role mappings ────────────────────────────────────
      for (const link of sub.links) {
        const escapedRoute = link.route.replace(/'/g, "''");
        const escapedName  = link.name.replace(/'/g, "''");

        await pool.request().query(`
          INSERT INTO VMaster.TBL_LINKS_AND_PAGES
            (SUB_MENU_ID, LINK_NAME, PAGE_ACTION, REDIRECTION_TYPE, LINK_LOCATION,
             LINK_SEQ_ID, STYLE_CSS, STATUS_MASTER, CREATED_BY, CREATED_DATE)
          VALUES
            (${smId}, '${escapedName}', '${escapedRoute}', 'internal', '${escapedRoute}',
             ${link.seq}, '${link.icon}', 'AC', 'System', GETDATE())
        `);

        const lRow = await pool.request().query(
          `SELECT LINK_ID FROM VMaster.TBL_LINKS_AND_PAGES
           WHERE SUB_MENU_ID = ${smId} AND LINK_SEQ_ID = ${link.seq}`
        );
        const linkId = Number(lRow.recordset[0].LINK_ID);

        await pool.request().query(`
          INSERT INTO VMaster.TBL_ROLE_TO_LINK_AND_PAGE
            (ROLE_ID_ROLE_TO_LINK, LINK_ID_ROLE_TO_LINK, STATUS_ROLE_TO_LINK, CREATED_DATE_ROLE_TO_LINK)
          VALUES (${roleId}, ${linkId}, 'AC', GETDATE())
        `);

        results.push({ mainMenu: mainMenu.name, subMenu: sub.name, link: link.name, route: link.route });
      }
    }
  }

  return results;
}

// ── Controllers ────────────────────────────────────────────────────────────

export const fixMenus = async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) {
    res.status(500).json({ error: "No DB pool" });
    return;
  }

  try {
    const roleId = await getOrCreateAdminRole(pool);

    // Check if already seeded
    const check = await pool
      .request()
      .query("SELECT COUNT(*) AS cnt FROM VMaster.TBL_MAIN_MENU");
    const count = Number(check.recordset[0].cnt);

    if (count > 0) {
      // Already seeded — just run the SP to confirm it works
      const navTest = await pool
        .request()
        .input("Role_Id", roleId)
        .execute("VMaster.Load_Main_Menu_Using_Role_Id");

      res.json({
        success: true,
        message: `Menus already seeded (${count} main menus). Call /fix-reset first to reseed.`,
        roleId,
        navMenuCount: navTest.recordset.length,
        menus: navTest.recordset,
      });
      return;
    }

    // Seed fresh
    const seeded = await seedMenus(pool, roleId);

    // Verify SP
    const navTest = await pool
      .request()
      .input("Role_Id", roleId)
      .execute("VMaster.Load_Main_Menu_Using_Role_Id");

    res.json({
      success: true,
      message: "Menu hierarchy seeded successfully!",
      roleId,
      navMenuCount: navTest.recordset.length,
      menus: navTest.recordset,
      seededItems: seeded,
    });
  } catch (err: any) {
    console.error("fixMenus error:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

export const resetAndReseedMenus = async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) {
    res.status(500).json({ error: "No DB pool" });
    return;
  }

  try {
    await clearMenuData(pool);
    res.json({ success: true, message: "All menu data cleared. Now call GET /api/v1/fix to reseed." });
  } catch (err: any) {
    console.error("resetMenus error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── Additive sync ─────────────────────────────────────────────────────────
// Inserts only menu/sub-menu/link rows that are missing, and ensures the
// Admin role is linked to every page. Never deletes or modifies existing rows.

async function ensureAdminLink(pool: any, roleId: number, linkId: number) {
  const rl = await pool.request().query(`
    SELECT 'X' AS X FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE
    WHERE ROLE_ID_ROLE_TO_LINK = ${roleId} AND LINK_ID_ROLE_TO_LINK = ${linkId}
  `);
  if (rl.recordset.length === 0) {
    await pool.request().query(`
      INSERT INTO VMaster.TBL_ROLE_TO_LINK_AND_PAGE
        (ROLE_ID_ROLE_TO_LINK, LINK_ID_ROLE_TO_LINK, STATUS_ROLE_TO_LINK, CREATED_DATE_ROLE_TO_LINK)
      VALUES (${roleId}, ${linkId}, 'AC', GETDATE())
    `);
    return true;
  }
  return false;
}

export const syncMenus = async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) {
    res.status(500).json({ error: "No DB pool" });
    return;
  }

  try {
    const roleId = await getOrCreateAdminRole(pool);
    const synced: any[] = [];
    let insertedLinks = 0;

    for (const mainMenu of MENU_STRUCTURE) {
      // Main menu
      const mmRes = await pool.request().query(
        `SELECT MAIN_MENU_ID FROM VMaster.TBL_MAIN_MENU WHERE MAIN_MENU_NAME = '${mainMenu.name}'`
      );
      let mmId = Number(mmRes.recordset[0]?.MAIN_MENU_ID || 0);
      let mainInserted = false;

      if (!mmId) {
        await pool.request().query(`
          INSERT INTO VMaster.TBL_MAIN_MENU
            (MAIN_MENU_NAME, MAIN_MENU_SEQ_ID, STATUS_MASTER, STYLE_CSS, PAGE_ACTION,
             CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
          VALUES
            ('${mainMenu.name}', ${mainMenu.seq}, 'AC', '${mainMenu.icon}', '',
             'System', GETDATE(), 'System', GETDATE())
        `);
        const mmRow = await pool.request().query(
          `SELECT MAIN_MENU_ID FROM VMaster.TBL_MAIN_MENU WHERE MAIN_MENU_NAME = '${mainMenu.name}'`
        );
        mmId = Number(mmRow.recordset[0].MAIN_MENU_ID);
        mainInserted = true;
      }

      for (const sub of mainMenu.subMenus) {
        const smRes = await pool.request().query(
          `SELECT SUB_MENU_ID FROM VMaster.TBL_SUB_MENU
           WHERE MAIN_MENU_ID = ${mmId} AND SUB_MENU_NAME = '${sub.name}'`
        );
        let smId = Number(smRes.recordset[0]?.SUB_MENU_ID || 0);
        let subInserted = false;

        if (!smId) {
          await pool.request().query(`
            INSERT INTO VMaster.TBL_SUB_MENU
              (MAIN_MENU_ID, SUB_MENU_NAME, SUB_MENU_SEQ_ID, STATUS_MASTER, STYLE_CSS,
               PAGE_ACTION, IS_PARENT, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
            VALUES
              (${mmId}, '${sub.name}', ${sub.seq}, 'AC', '${sub.icon}',
               '', 'Y', 'System', GETDATE(), 'System', GETDATE())
          `);
          const smRow = await pool.request().query(
            `SELECT SUB_MENU_ID FROM VMaster.TBL_SUB_MENU
             WHERE MAIN_MENU_ID = ${mmId} AND SUB_MENU_NAME = '${sub.name}'`
          );
          smId = Number(smRow.recordset[0].SUB_MENU_ID);
          subInserted = true;
        }

        for (const link of sub.links) {
          const escapedRoute = link.route.replace(/'/g, "''");
          const escapedName = link.name.replace(/'/g, "''");

          const linkRes = await pool.request().query(
            `SELECT LINK_ID FROM VMaster.TBL_LINKS_AND_PAGES
             WHERE SUB_MENU_ID = ${smId} AND PAGE_ACTION = '${escapedRoute}'`
          );
          let linkId = Number(linkRes.recordset[0]?.LINK_ID || 0);
          let linkInserted = false;

          if (!linkId) {
            await pool.request().query(`
              INSERT INTO VMaster.TBL_LINKS_AND_PAGES
                (SUB_MENU_ID, LINK_NAME, PAGE_ACTION, REDIRECTION_TYPE, LINK_LOCATION,
                 LINK_SEQ_ID, STYLE_CSS, STATUS_MASTER, CREATED_BY, CREATED_DATE)
              VALUES
                (${smId}, '${escapedName}', '${escapedRoute}', 'internal', '${escapedRoute}',
                 ${link.seq}, '${link.icon}', 'AC', 'System', GETDATE())
            `);
            const lRow = await pool.request().query(
              `SELECT LINK_ID FROM VMaster.TBL_LINKS_AND_PAGES
               WHERE SUB_MENU_ID = ${smId} AND PAGE_ACTION = '${escapedRoute}'`
            );
            linkId = Number(lRow.recordset[0].LINK_ID);
            linkInserted = true;
            insertedLinks++;
          }

          const roleMapped = await ensureAdminLink(pool, roleId, linkId);

          synced.push({
            mainMenu: mainMenu.name,
            subMenu: sub.name,
            link: link.name,
            route: link.route,
            inserted: linkInserted,
            roleMapped,
            mainInserted,
            subInserted,
          });
        }
      }
    }

    // Verify SP
    const navTest = await pool
      .request()
      .input("Role_Id", roleId)
      .execute("VMaster.Load_Main_Menu_Using_Role_Id");

    res.json({
      success: true,
      message: "Menu sync complete.",
      roleId,
      insertedLinks,
      navMenuCount: navTest.recordset.length,
      menus: navTest.recordset,
      synced,
    });
  } catch (err: any) {
    console.error("syncMenus error:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

// ── Duplicate cleanup ──────────────────────────────────────────────────────
// The DB currently contains old redundant sub-menus (Inventory, Sales &
// Pricing, Travel & Tourism, Arms & Ammunition) whose pages all duplicate the
// current sub-menus, plus a handful of links that appear in two sub-menus.
// This endpoint removes ONLY those duplicate rows so every page appears once.
// It is idempotent: running it again deletes nothing.

const REDUNDANT_SUBMENUS = [
  "Inventory",
  "Sales & Pricing",
  "Travel & Tourism",
  "Arms & Ammunition",
];

const DUP_LINKS_TO_DELETE = [
  { sub: "Admin Master", route: "/user-store-mapping" },
  { sub: "Organization", route: "/license-permit-type" },
  { sub: "Organization", route: "/license-permit-cost" },
  { sub: "Organization", route: "/trailer-type-master" },
  { sub: "Financial", route: "/cost-centre-master" },
  { sub: "Financial", route: "/bank-master" },
  { sub: "Financial", route: "/company-bank-account-master" },
  { sub: "Financial", route: "/new-salary-scale" },
];

async function getSubMenuIdByName(pool: any, mainMenuName: string, subMenuName: string): Promise<number> {
  const res = await pool.request().query(`
    SELECT b.SUB_MENU_ID
    FROM VMaster.TBL_SUB_MENU b
    INNER JOIN VMaster.TBL_MAIN_MENU a ON a.MAIN_MENU_ID = b.MAIN_MENU_ID
    WHERE a.MAIN_MENU_NAME = '${mainMenuName.replace(/'/g, "''")}'
      AND b.SUB_MENU_NAME = '${subMenuName.replace(/'/g, "''")}'
  `);
  return Number(res.recordset[0]?.SUB_MENU_ID || 0);
}

async function deleteSubMenuCompletely(pool: any, mainMenuName: string, subMenuName: string): Promise<number> {
  const subMenuId = await getSubMenuIdByName(pool, mainMenuName, subMenuName);
  if (!subMenuId) return 0;

  const linksRes = await pool.request().query(
    `SELECT LINK_ID FROM VMaster.TBL_LINKS_AND_PAGES WHERE SUB_MENU_ID = ${subMenuId}`
  );
  const linkCount = linksRes.recordset.length;

  await pool.request().query(`
    DELETE FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE
    WHERE LINK_ID_ROLE_TO_LINK IN (
      SELECT LINK_ID FROM VMaster.TBL_LINKS_AND_PAGES WHERE SUB_MENU_ID = ${subMenuId}
    )
  `);
  await pool.request().query(`DELETE FROM VMaster.TBL_LINKS_AND_PAGES WHERE SUB_MENU_ID = ${subMenuId}`);
  await pool.request().query(`DELETE FROM VMaster.TBL_SUB_MENU WHERE SUB_MENU_ID = ${subMenuId}`);

  return linkCount;
}

async function deleteLinkInSubMenu(pool: any, mainMenuName: string, subMenuName: string, pageAction: string): Promise<number> {
  const subMenuId = await getSubMenuIdByName(pool, mainMenuName, subMenuName);
  if (!subMenuId) return 0;

  const linkRes = await pool.request().query(`
    SELECT LINK_ID FROM VMaster.TBL_LINKS_AND_PAGES
    WHERE SUB_MENU_ID = ${subMenuId} AND PAGE_ACTION = '${pageAction.replace(/'/g, "''")}'
  `);
  const linkId = Number(linkRes.recordset[0]?.LINK_ID || 0);
  if (!linkId) return 0;

  await pool.request().query(`DELETE FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE WHERE LINK_ID_ROLE_TO_LINK = ${linkId}`);
  await pool.request().query(`DELETE FROM VMaster.TBL_LINKS_AND_PAGES WHERE LINK_ID = ${linkId}`);

  return 1;
}

export const cleanupDuplicateMenus = async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) {
    res.status(500).json({ error: "No DB pool" });
    return;
  }

  const results: any[] = [];
  let removedSubmenus = 0;
  let removedLinks = 0;

  try {
    for (const sub of REDUNDANT_SUBMENUS) {
      const removed = await deleteSubMenuCompletely(pool, "Masters", sub);
      if (removed > 0) {
        removedSubmenus++;
        removedLinks += removed;
        results.push({ action: "removedSubMenu", subMenu: sub, links: removed });
      }
    }

    for (const dup of DUP_LINKS_TO_DELETE) {
      const removed = await deleteLinkInSubMenu(pool, "Masters", dup.sub, dup.route);
      if (removed > 0) {
        removedLinks += removed;
        results.push({ action: "removedLink", subMenu: dup.sub, route: dup.route });
      }
    }

    res.json({
      success: true,
      message: "Duplicate menu cleanup complete.",
      removedSubmenus,
      removedLinks,
      results,
    });
  } catch (err: any) {
    console.error("cleanupDuplicateMenus error:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};
