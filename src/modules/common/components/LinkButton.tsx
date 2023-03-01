export default function LinkButton(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) {
  const { children, className, ...rest } = props;
  return (
    <button className={`link-button ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
