import React, { useState, useEffect } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Button, message, Upload, Flex, Typography, Col, Row, Alert, Spin, Progress, ConfigProvider, Card, Table, Tag, Space, Empty } from 'antd';
import { BugTwoTone } from '@ant-design/icons';

import axios from 'axios';

const { Title } = Typography;
const { Dragger } = Upload;

const fileUploadStyle = {
    width: '600px',
}

const FileUpload = () => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState([]);
    const [analysisReady, setAnalysisReady] = useState(false);
    const [percentageOfOK, setPercentageOfOK] = useState(100);
    const [percentageOfSusAndOK, setPercentageOfSusAndOK] = useState({ percent: 100 });
    const [countOfMalAndSusOverTotal, setCountOfMalAndSusOverTotal] = useState("0 / 0");
    const pollingInterval = 5000;

    const categories = {
        "confirmed-timeout": "blue",
        "timeout": "geekblue",
        "harmless": "green",
        "undetected": "lime",
        "failure": "red",
        "malicious": "volcano",
        "suspicious": "orange",
        "type-unsupported": "purple",
        "others": "gold"
    }

    const columns = [
        {
            title: 'Engine',
            dataIndex: 'engine_name',
            key: 'engine_name',
        },
        {
            title: 'Method',
            dataIndex: 'method',
            key: 'method',
            render: (text) => <p>{text.toUpperCase()}</p>,
        },
        {
            title: 'Category',
            key: 'category',
            dataIndex: 'category',
            render: (tags) => <Tag color={categories[tags]}>{tags.toUpperCase()}</Tag>,
        },
        {
            title: 'Results',
            dataIndex: 'result',
            key: 'result',
            render: (text) => <p>{ (text === undefined || text === null) ? "N/A" : text }</p>,
        },
    ];

    const pollUntilAnalysisReceived = async (url, interval) => {
        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'x-apikey': process.env.REACT_APP_VT_API_KEY,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
            });

            if (response.data.data.attributes.status === "completed") {
                return response;
            } else {
                console.log('Analysis not yet available. Polling again in', interval, 'milliseconds.');

                await new Promise(resolve => setTimeout(resolve, interval));

                return pollUntilAnalysisReceived(url, interval);
            }
        } catch (error) {
            console.error('Error polling API:', error);
            throw error;
        }
    };

    const handleUpload = async () => {
        const formData = new FormData();

        fileList.forEach((file) => {
            formData.append('file', file);
        });

        setUploading(true);

        try {
            const uploadRes = await axios.post('https://www.virustotal.com/api/v3/files', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                    'x-apikey': process.env.REACT_APP_VT_API_KEY,
                },
            });

            setFileList([]);
            message.success('File uploaded to VirusTotal successfully!');
            setLoading(true);

            const analysisId = uploadRes.data.data.id;

            const analysisRes = await pollUntilAnalysisReceived("https://www.virustotal.com/api/v3/analyses/" + analysisId, pollingInterval)

            setAnalysis(analysisRes);

            const onlyResults = Object.values(analysisRes.data.data.attributes.results);
            const resultsWithKeys = []

            for (let i = 0; i < onlyResults.length; i++) {
                onlyResults[i].key = (i + 1).toString();
                resultsWithKeys.push(onlyResults[i])
            }

            console.log(analysisRes);

            const stats = analysisRes.data.data.attributes.stats;
            console.log(stats)
            const total = stats.harmless + stats.undetected + stats.suspicious + stats.malicious
            const countOfMalAndSus = stats.suspicious + stats.malicious
            setCountOfMalAndSusOverTotal(countOfMalAndSus.toString() + " / " + total.toString())
            setPercentageOfOK({ percent: ((stats.harmless + stats.undetected) / total) * 100 })
            setPercentageOfSusAndOK(((stats.harmless + stats.undetected + stats.suspicious) / total) * 100)

            setAnalysis(resultsWithKeys)
            setLoading(false);
            setAnalysisReady(true);

        } catch (error) {
            console.error(error);
            message.error('File upload failed, please try again!');
        }

        setUploading(false);

    };

    const props = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            setFileList([...fileList, file]);
            return false;
        },
        fileList,
    };

    return (
        < div style={{ height: '100vh' }} >

            <Row align="middle" style={{ height: '100vh' }}>
                <Col span={12}>
                    <div >
                        <Title align='center'>Upload File for VT Scanning <BugTwoTone /></Title>

                        <Flex justify='center' align='center' vertical>

                            <Flex vertical={true}>

                                <Dragger maxCount={1} style={fileUploadStyle} {...props}>
                                    <p className='ant-upload-drag-icon'>
                                        <InboxOutlined />
                                    </p>
                                    <p className='ant-upload-text'>Click or drag file to this area to upload</p>
                                    <p className='ant-upload-hint'>
                                        Support for a single upload only.
                                    </p>
                                </Dragger>

                                <Button
                                    type='primary'
                                    onClick={handleUpload}
                                    disabled={fileList.length === 0}
                                    loading={uploading}
                                    style={{
                                        marginTop: 16,
                                        alignItems: 'center'
                                    }}
                                >
                                    {uploading ? 'Uploading' : 'Start Upload'}
                                </Button>
                            </Flex>
                        </Flex>
                    </div>
                </Col>
                <Col span={12}>
                    <Spin spinning={loading} delay={500}>
                        {
                            !analysisReady && <Empty />
                        }

                        {
                            analysisReady && <>
                                <ConfigProvider
                                    theme={{
                                        components: {
                                            Progress: {
                                                remainingColor: "red",
                                                defaultColor: "orange"
                                            },
                                        },
                                    }}
                                >
                                    <Row align="start">
                                        <Progress type="circle" percent={percentageOfSusAndOK} success={percentageOfOK} format={() => countOfMalAndSusOverTotal} />
                                    </Row>

                                    <br />
                                    <div style={{ marginRight: '100px' }}>
                                        <Table padding columns={columns} dataSource={analysis} pagination={{ pageSize: 8, showSizeChanger: false }} />
                                    </div>

                                </ConfigProvider>
                            </>
                        }
                    </Spin>
                </Col>
            </Row>

        </div>
    );
};

export default FileUpload;