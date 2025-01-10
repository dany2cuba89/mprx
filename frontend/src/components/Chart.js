import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Chart = ({ type, data, options }) => {
  if (type === "bar") {
    return <Bar data={data} options={options} />;
  }

  if (type === "pie") {
    return <Pie data={data} options={options} />;
  }

  return null;
};

export default Chart;
