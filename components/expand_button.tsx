export type Menu = 'none' | 'history' | 'params' | 'artists' | 'styles';

function stringForMenu(menu: Menu) {
  switch (menu) {
    case 'none':
      return 'none';
    case 'history':
      return 'History';
    case 'params':
      return 'Settings';
    case 'artists':
      return 'Artists';
    case 'styles':
      return 'Styles';
  }
}

function imageSrcForMenu(menu: Menu) {
  switch (menu) {
    case 'history':
      return '/history.svg';
    case 'params':
      return '/settings.svg';
    case 'artists':
      return '/style.svg';
    default:
      return '/mirror.svg';
  }
}

export function ExpandButton({
  menu,
  setExpanded,
  expanded,
  direction,
}: {
  menu: Menu;
  setExpanded: (menu: Menu) => void;
  expanded: Menu;
  direction: 'left' | 'right';
}) {
  return (
    <button
      className={expanded === menu ? 'expand-button active' : 'expand-button'}
      onClick={() => setExpanded(expanded === menu ? 'none' : menu)}
      title={stringForMenu(menu)}
    >
      <div>
        <img src={imageSrcForMenu(menu)} />
      </div>
    </button>
  );
}
