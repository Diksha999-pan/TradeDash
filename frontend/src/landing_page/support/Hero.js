function Hero() {
  return (
    <section className="container-fluid" id="supportHero">
      <div className="p-3" id="supportWrapper">
        <h4>Support Portal</h4>
        <a href="">Track Tickets</a>
      </div>
      <div className="row p-3 m-3">
        <div className="col-6 p-3">
          <input
            placeholder="Eg: how do i activate F&O, why is my order getting rejected ..."
          />
          <a href="">Track account opening</a>
          <a href="">Track segment activation</a>
          <a href="">Intraday margins</a>
          <a href="">Kite user manual </a>
        </div>
        <div className="col-6 p-5 mt-2 mb-4">
          <h1 className="fs-3">Featured</h1>
          <ol>
            <li>
              {" "}
              <a href="">Quarterly Settlement of Funds - July 2025</a>{" "}
            </li>
            <br/>
            <li>
              <a href="">
                Exclusion of F&O contracts on 8 securities from August 29, 2025
              </a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

export default Hero;
