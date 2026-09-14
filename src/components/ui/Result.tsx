import React from "react";
import { Button, Result } from "antd";

interface ResultProps {
  status: "success" | "error" | "info" | "warning" | "404" | "403" | "500";
  title: string;
  subTitle?: string;
  extra?: React.ReactNode[];
}

const ShowResult = (props: ResultProps) => (
  <Result
    status={props.status}
    title={props.title}
    subTitle={props.subTitle}
    extra={props.extra}
  />
);

export default ShowResult;
