import style from './fs.module.css';
function FormSpinner() {
  return (
    <div className={style.spinnerBox}>
      <div className={style.spinner}>
        <div className={style.FormSpinner}></div>
      </div>
    </div>
  );
}

export default FormSpinner;
