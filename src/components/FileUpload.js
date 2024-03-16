import React, { useState, useEffect } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Button, message, Upload, Flex, Typography } from 'antd';
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
    const [analysis, setAnalysis] = useState("Waiting on the server");
    const pollingInterval = 5000;

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

            const analysisId = uploadRes.data.data.id;

            const analysisRes = await pollUntilAnalysisReceived("https://www.virustotal.com/api/v3/analyses/" + analysisId, pollingInterval)

            setAnalysis(analysisRes);

            console.log(analysisRes);

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
        <>
            <Title align='center'>Upload File for VT Scanning <BugTwoTone /></Title>

            <Flex justify='center' align='center'>

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

        </>
    );
};

export default FileUpload;