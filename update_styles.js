const fs = require('fs');

const loginMapping = {
  'styles.container': 'styles.authContainer',
  'styles.cardSection': 'styles.authCardSection',
  'styles.mainTitle': 'styles.authMainTitle',
  'styles.subtitle': 'styles.authSubtitle',
  'styles.inputRow': 'styles.authInputRow',
  'styles.inputLabel': 'styles.authInputLabel',
  'styles.input': 'styles.authInput',
  'styles.actionBtn': 'styles.authActionBtn',
  'styles.btnText': 'styles.authBtnText',
  'styles.switchBtn': 'styles.authSwitchBtn',
  'styles.switchText': 'styles.authSwitchText',
  'styles.switchTextBold': 'styles.authSwitchTextBold',
};

const signupMapping = {
  ...loginMapping,
  'styles.roleContainer': 'styles.authRoleContainer',
  'styles.roleTab': 'styles.authRoleTab',
  'styles.roleTabActive': 'styles.authRoleTabActive',
  'styles.roleText': 'styles.authRoleText',
  'styles.roleTextActive': 'styles.authRoleTextActive',
  'styles.actionBtn': 'styles.authActionBtnSignup',
  'styles.switchTextBold': 'styles.authSwitchTextBoldSignup',
};

const dashboardMapping = {
  'styles.container': 'styles.dashContainer',
  'styles.centered': 'styles.centered',
  'styles.searchWrapper': 'styles.dashSearchWrapper',
  'styles.searchBar': 'styles.dashSearchBar',
  'styles.searchInput': 'styles.dashSearchInput',
  'styles.gridCard': 'styles.dashGridCard',
  'styles.cardHeader': 'styles.dashCardHeader',
  'styles.cardSubtitle': 'styles.dashCardSubtitle',
  'styles.table': 'styles.dashTable',
  'styles.tableRow': 'styles.dashTableRow',
  'styles.tableHeader': 'styles.dashTableHeader',
  'styles.rowAlt': 'styles.dashRowAlt',
  'styles.headerCell': 'styles.dashHeaderCell',
  'styles.cell': 'styles.dashCell',
  'styles.roleBadge': 'styles.dashRoleBadge',
  'styles.managerBadge': 'styles.dashManagerBadge',
  'styles.adminBadge': 'styles.dashAdminBadge',
  'styles.userBadge': 'styles.dashUserBadge',
  'styles.roleText': 'styles.dashRoleText',
  'styles.saveBtn': 'styles.dashSaveBtn',
  'styles.saveBtnText': 'styles.dashSaveBtnText',
  'styles.noResults': 'styles.dashNoResults',
  'styles.noResultsText': 'styles.dashNoResultsText',
};

const crudMapping = {
  'styles.flatListContent': 'styles.crudFlatListContent',
  'styles.headerContent': 'styles.crudHeaderContent',
  'styles.footerContent': 'styles.crudFooterContent',
  'styles.mainTitle': 'styles.crudMainTitle',
  'styles.cardSection': 'styles.crudCardSection',
  'styles.sectionHeaderCentered': 'styles.crudSectionHeaderCentered',
  'styles.tableSubtitle': 'styles.crudTableSubtitle',
  'styles.inputRow': 'styles.crudInputRow',
  'styles.inputLabel': 'styles.crudInputLabel',
  'styles.input': 'styles.crudInput',
  'styles.addBtn': 'styles.crudAddBtn',
  'styles.actionBtn': 'styles.crudActionBtn',
  'styles.addBtnText': 'styles.crudAddBtnText',
  'styles.emptyText': 'styles.crudEmptyText',
  'styles.tableHeader': 'styles.crudTableHeader',
  'styles.tableHeaderCellNo': 'styles.crudTableHeaderCellNo',
  'styles.tableHeaderCellName': 'styles.crudTableHeaderCellName',
  'styles.tableRow': 'styles.crudTableRow',
  'styles.tableCellNo': 'styles.crudTableCellNo',
  'styles.tableCellName': 'styles.crudTableCellName',
  'styles.restrictedContainer': 'styles.crudRestrictedContainer',
  'styles.restrictedTitle': 'styles.crudRestrictedTitle',
  'styles.restrictedSubtitle': 'styles.crudRestrictedSubtitle',
};

const indexMapping = {
  'styles.loadingContainer': 'styles.indexLoadingContainer',
  'styles.container': 'styles.globalContainer',
  'styles.header': 'styles.indexHeader',
  'styles.headerLeft': 'styles.indexHeaderLeft',
  'styles.headerRight': 'styles.indexHeaderRight',
  'styles.headerEmail': 'styles.indexHeaderEmail',
  'styles.headerRole': 'styles.indexHeaderRole',
  'styles.iconBtn': 'styles.indexIconBtn',
  'styles.screenPickerContainer': 'styles.indexScreenPickerContainer',
  'styles.screenPicker': 'styles.indexScreenPicker',
  'styles.screenPill': 'styles.indexScreenPill',
  'styles.screenPillActive': 'styles.indexScreenPillActive',
  'styles.screenPillText': 'styles.indexScreenPillText',
  'styles.whiteText': 'styles.indexWhiteText',
};

function updateFile(filePath, mapping, removeStylesBlock = true, importPath = "") {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace styles map
  for (const [key, value] of Object.entries(mapping)) {
    const regex = new RegExp(key.replace('.', '\\.'), 'g');
    content = content.replace(regex, value);
  }

  // Handle removing StyleSheet.create block at the bottom
  if (removeStylesBlock) {
    const styleStart = content.indexOf('const styles = StyleSheet.create({');
    if (styleStart !== -1) {
      content = content.substring(0, styleStart).trim() + '\n';
    }
  }

  // Handle import added
  if (importPath) {
    if (!content.includes(`import styles from '`)) {
       // Insert import after react-native imports or other local imports
       content = content.replace(/import .*? from 'react-native';\n/, match => match + `import styles from '${importPath}';\n`);
    }
  }

  // Remove some specific old local styles import for dashboards
  if (content.includes("import dashboardStyles from '../components/shared/dashboardStyles';")) {
      content = content.replace("import dashboardStyles from '../components/shared/dashboardStyles';\n", "");
      content = content.replace("const styles = dashboardStyles;\n", "");
  }

  fs.writeFileSync(filePath, content);
}

updateFile('src/screens/Login.js', loginMapping, true, '../style');
updateFile('src/screens/Signup.js', signupMapping, true, '../style');
updateFile('src/screens/Dashboard.js', dashboardMapping, false, '../style');
updateFile('src/screens/ManagerDashboard.js', dashboardMapping, false, '../style');
updateFile('src/components/CrudTemplate.js', crudMapping, true, '../style');
updateFile('app/index.tsx', indexMapping, true, '../src/style');

console.log("Files updated via script!");
