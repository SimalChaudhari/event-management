import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import config from '../../../../config';
import navigation from '../../../../menu-items';
import DEMO from '../../../../store/constant';
const Breadcrumb = (props) => {
    const [main, setMain] = useState();
    const [item, setItem] = useState();
    const location = useLocation();
    const navigate = useNavigate();
    
    const getCollapse = useCallback((item) => {
        if (item.children) {
            item.children.filter((collapse) => {
                if (collapse.type && collapse.type === 'collapse') {
                    getCollapse(collapse);
                }
                else if (collapse.type && collapse.type === 'item') {
                    if (location.pathname === config.basename + collapse.url) {
                        setItem(collapse);
                        setMain(item);
                    }
                }
                return false;
            });
        }
    }, [location.pathname]);

    useEffect(() => {
        navigation.items.map((item, index) => {
            if (item.type && item.type === 'group') {
                getCollapse(item);
            }
            return false;
        });
    }, [props, getCollapse]);
    
    let main_, item_;
    let breadcrumb = '';
    let title = 'Welcome';

        // Handler for when main collapse item is clicked
        const handleMainClick = () => {
            if (main && main.children && main.children.length > 0) {
                // Navigate to the first child URL by default
                const firstChildUrl = main.children[0].url;
                if (firstChildUrl) {
                    navigate(firstChildUrl);
                }
            }
        };

    if (main && main.type === 'collapse') {
        main_ = (
            <li className="breadcrumb-item">
                <a onClick={handleMainClick} style={{cursor: 'pointer'}}>
                    {main.title}
                </a>
            </li>
        );
    }
    if (item && item.type === 'item') {
        title = item.title;
        item_ = (<li className="breadcrumb-item">
                <a href={DEMO.BLANK_LINK}>{title}</a>
            </li>);
        if (item.breadcrumbs !== false) {
            breadcrumb = (<div className="page-header">
                    <div className="page-block">
                        <div className="row align-items-center">
                            <div className="col-md-12">
                                <div className="page-header-title">
                                    <h5 className="m-b-10">{title}</h5>
                                </div>
                                <ul className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <Link to="/dashboard">
                                            <i className="feather icon-home"/>
                                        </Link>
                                    </li>
                                    {main_}
                                    {item_}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>);
        }
    }
    document.title = title + ' | CRM';
    return <>{breadcrumb}</>;
};
export default Breadcrumb;
