

const routes = [
    // { path: '/' + appName + '/dictionary', name: 'dictionary', component: Dictionary },
    { path: '/sensors', name: 'sensorList', component: SensorList },
    { path: '/manageitems', name: 'manageItemList', component: ManageItemList },
    { path: '/logList/:logType/:startIndex/:itemsPerPage', name: 'logList', component: LogList, props: true },
    { path: '/:category?', name: 'switchItemsTab', component: SwitchItemsTab, props: true }
  ];
  
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory('/' + appName + '/'),
    // history: VueRouter.createWebHistory('/' + appName + '/'),
    // base: '/' + appName + '/',
	routes,
});

app.use(router)