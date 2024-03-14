import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { InboxOutlined } from '@ant-design/icons';
import { Button, Form, Upload, Flex, Typography } from 'antd';

import { BugTwoTone } from '@ant-design/icons';

const AppContent = () => {

    const { Title } = Typography;

    const normFile = (e) => {
        console.log('Upload event:', e);
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    const onFinish = (values) => {
        console.log('Received values of form: ', values);
    };

    const formStyle = {
        width: '600px'
    };

    const buttonStyle = {
        width: '600px'
    }

    const titleStyle = {
        padding: '50px'
    }

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [posts, setPosts] = useState([]);

    const addPosts = async (title, body) => {
        await fetch('https://jsonplaceholder.typicode.com/posts', {
           method: 'POST',
           body: JSON.stringify({
              title: title,
              body: body,
              userId: Math.random().toString(36).slice(2),
           }),
           headers: {
              'Content-type': 'application/json; charset=UTF-8',
           },
        })
           .then((response) => response.json())
           .then((data) => {
              setPosts((posts) => [data, ...posts]);
              setTitle('');
              setBody('');
              console.log(data);
              console.log(process.env.REACT_APP_API_KEY)
           })
           .catch((err) => {
              console.log(err.message);
           });
     };

    const handleSubmit = (e) => {
        // e.preventDefault();
        addPosts("My title", "My body");
     }; 

    return (
        <>

            <Title style={titleStyle} align='center'>Upload File for VT Scanning <BugTwoTone /></Title>

            <Flex justify='center' align='center'>

                <Form name="basic" style={formStyle} onFinish={() => addPosts("A", "B")} >

                    <Form.Item>
                        <Form.Item name="dragger" valuePropName="fileList" getValueFromEvent={normFile} noStyle>
                            <Upload.Dragger name="files" maxCount="1">
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                <p className="ant-upload-hint">Support for a single upload.</p>
                            </Upload.Dragger>
                        </Form.Item>
                    </Form.Item>

                    <Form.Item>
                        <Button style={buttonStyle} type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>
                </Form>

            </Flex>

        </>
    );
};
export default AppContent;