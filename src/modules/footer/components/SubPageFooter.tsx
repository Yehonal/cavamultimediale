import BottomLeftMenu from "./BottomLeftMenu";
import BottomRightMenu from "./BottomRightMenu";
import "./SubPageFooter.css";

export default function SubPageFooter({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div id="bottom-bar" className="hidden-bottom-bar">
      <div id="bottom-left">
        <BottomLeftMenu />
      </div>
      <div id="bottom-center">{children}</div>
      <BottomRightMenu />
    </div>
  );
}
