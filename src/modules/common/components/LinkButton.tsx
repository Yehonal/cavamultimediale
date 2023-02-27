export default function LinkButton(props: any) {
  const { children, className, ...rest } = props;
  return (
    <button className={`link-button ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
