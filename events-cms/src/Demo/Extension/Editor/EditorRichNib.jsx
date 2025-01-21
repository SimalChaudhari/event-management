import * as React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import Editor from 'nib-core';
const content = {
    doc: {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: 'This editor is rad'
                    }
                ]
            },
            {
                type: 'heading',
                attrs: {
                    level: '3'
                },
                content: [
                    {
                        type: 'text',
                        text: 'Some flowers for you'
                    }
                ]
            },
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'image',
                        attrs: {
                            src: 'https://i.imgur.com/UvtVxv1.jpg',
                            style: {
                                height: 'auto',
                                width: 'auto'
                            }
                        }
                    }
                ]
            },
            {
                type: 'paragraph'
            }
        ]
    },
    selection: {
        type: 'text',
        anchor: 1,
        head: 1
    }
};
const EditorRichNib = () => {
    return (<>
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title as="h5">Rich Text Editor</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Editor defaultValue={content}/>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>);
};
export default EditorRichNib;
