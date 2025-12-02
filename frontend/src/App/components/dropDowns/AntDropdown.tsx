import { Dropdown, DropdownProps, MenuProps } from 'antd';
import { useState } from 'react';

const AntDropdown = ({
  data = null,
  children,
  dropDownList,
  preventCloseList = [],
}: {
  dropDownList: any;
  preventCloseList?: string[];
  data?: any;
  children: React.ReactNode;
}) => {
  const [openDrawer, setopenDrawer] = useState(false);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (!preventCloseList.includes(e.key)) {
      setopenDrawer(false);
    }
  };
  const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
    if (info.source === 'trigger' || nextOpen) {
      setopenDrawer(nextOpen);
    }
  };

  return (
    <Dropdown
      open={openDrawer}
      menu={{ items: dropDownList(data), onClick: handleMenuClick }}
      placement='bottomRight'
      onOpenChange={handleOpenChange}
    >
      {children}
    </Dropdown>
  );
};

export default AntDropdown;
