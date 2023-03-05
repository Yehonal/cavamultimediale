import LinkButton from "./LinkButton";
import CopyButtonImg from "../../../data/media/images/vari/copy.bmp";

export default function CopyButton(props: {
  language: "e" | "i";
  pageText: string;
}) {
  return (
    <LinkButton
      onClick={() => {
        navigator.clipboard.writeText(props.pageText);
        alert(
          props.language === "e"
            ? "The text is in the clipboard"
            : "Testo copiato negli appunti"
        );
      }}
    >
      <img src={CopyButtonImg} alt="copybutton" />
    </LinkButton>
  );
}
